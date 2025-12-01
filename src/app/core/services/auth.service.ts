import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map, switchMap, tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../../features/admin/users/interfaces/user-profile.interface';
import { User } from '../../../features/admin/users/interfaces/user.interface';

// Interface para tipar a resposta do Login (Boas Práticas)
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  // Estado Reativo do Usuário
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  // Estado do Perfil (Admin/Gestor)
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.profileSubject.asObservable();

  // Controle de Timer
  private refreshTokenTimeout: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Se recarregar a página e tiver token, tenta agendar o refresh
    if (this.getToken()) {
      this.startTokenRefresh();
    }
  }

  // ============================================================
  // LOGIN ADM
  // ============================================================
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(() => this.profileSubject.next(null)),
        map((response) => {
          this.setSession(response);
          return response;
        }),
        // Tenta carregar perfil, mas não bloqueia o login se falhar
        switchMap((response) =>
          this.loadUserProfile().pipe(
            map(() => response),
            catchError(() => of(response))
          )
        )
      );
  }

  // ============================================================
  // LOGIN CLIENTE (Otimizado)
  // ============================================================
  loginClient(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/client/login`, credentials)
      .pipe(
        tap(() => this.profileSubject.next(null)),
        map((response) => {
          this.setSession(response);
          return response;
        })
      );
  }

  // ============================================================
  // GESTÃO DE SESSÃO (Centralizada)
  // ============================================================
  private setSession(response: AuthResponse): void {
    if (response?.accessToken && response?.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.accessToken);

      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      this.currentUserSubject.next(response.user);
      this.startTokenRefresh();
    } else {
      throw new Error('Resposta de login inválida.');
    }
  }

  logout() {
    this.stopRefreshToken();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    this.currentUserSubject.next(null);
    this.profileSubject.next(null);

    this.router.navigate(['/login']);
  }

  // ============================================================
  // OPTIMIZATION: getUserCached Refatorado
  // ============================================================
  // Antes: Fazia subscribe interno (perdia controle de erro).
  // Agora: Retorna o Observable direto.
  getUserCached(): Observable<User | null> {
    const user = this.currentUserSubject.value;
    if (user) {
      return of(user);
    }

    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap((u) => this.currentUserSubject.next(u)), // Atualiza estado global
      catchError(() => {
        // Se der erro (ex: 401), garante que o estado local limpe
        // this.logout(); // Opcional: forçar logout se falhar o /me
        return of(null);
      })
    );
  }

  // ============================================================
  // PERFIL & UTILITÁRIOS
  // ============================================================
  loadUserProfile(): Observable<UserProfile> {
    return this.http
      .get<UserProfile>(`${this.apiUrl}/users/profile`)
      .pipe(tap((profile) => this.profileSubject.next(profile)));
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${this.apiUrl}/users/profile`, data)
      .pipe(
        tap((updatedProfile) => {
          this.profileSubject.next(updatedProfile);

          // Atualiza o user básico no Subject para refletir mudança de nome no header
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            const updatedUser = { ...currentUser, name: updatedProfile.name };
            this.currentUserSubject.next(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // ============================================================
  // REFRESH TOKEN (Com limpeza de Timer)
  // ============================================================
  private stopRefreshToken() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  startTokenRefresh() {
    this.stopRefreshToken(); // Garante que não tenha timer duplicado

    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      const exp = expirationDate ? expirationDate.getTime() : 0;

      // Renova 2 minutos antes de expirar (mais seguro que 5)
      const delay = exp - Date.now() - 2 * 60 * 1000;

      if (delay > 0) {
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), delay);
      } else {
        // Se o token ainda é válido mas o delay é negativo, renova agora
        this.refreshToken();
      }
    }
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // Sem refresh token, deixa a sessão morrer naturalmente ou força logout
      return;
    }

    this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )
      .subscribe({
        next: (res) => {
          if (res?.accessToken) {
            localStorage.setItem('token', res.accessToken);
            if (res.refreshToken) {
              localStorage.setItem('refreshToken', res.refreshToken);
            }
            this.startTokenRefresh(); // Reinicia o ciclo
          }
        },
        error: () => {
          // Se falhar renovar (ex: refresh expirado), logout obrigatório
          this.logout();
        },
      });
  }

  changePassword(data: any) {
    return this.http.put(`${this.apiUrl}/auth/change-password`, data);
  }
}
