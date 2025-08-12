import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../../modules/users/interfaces/user-profile.interface';
import { User } from '../../../modules/users/interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>; // reactive stream
  private refreshTokenTimeout: any;
  public currentUser: Observable<User | null>;

  // Cache do perfil
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.profileSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // Login do usuário
  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(() => this.profileSubject.next(null)), // limpa cache de perfil
        map((response) => {
          if (response?.accessToken && response?.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.accessToken);
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }
            this.currentUserSubject.next(response.user as User);
            this.startTokenRefresh();
            return response;
          }
          throw new Error('Resposta de login inválida.');
        }),
        // garante que o observable só complete após cachear o profile
        switchMap((response) =>
          this.loadUserProfile().pipe(map(() => response))
        )
      );
  }

  // Logout do usuário
  logout() {
    // Remove o usuário e o token do localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.profileSubject.next(null);
    clearTimeout(this.refreshTokenTimeout);
    this.router.navigate(['/login']);
  }

  // Obtém o token atual
  getToken() {
    return localStorage.getItem('token');
  }
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  // Verifica se o usuário está autenticado
  isAuthenticated() {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // Carrega perfil com cache para evitar múltiplas chamadas
  loadUserProfile(): Observable<UserProfile> {
    const cached = this.profileSubject.getValue();
    if (cached) return of(cached);
    return this.http
      .get<UserProfile>(`${this.apiUrl}/user/profile`)
      .pipe(tap((profile) => this.profileSubject.next(profile)));
  }

  // Mantém compatibilidade (evite usar diretamente; prefira userProfile$ ou loadUserProfile)
  getUserProfile(): Observable<UserProfile> {
    return this.loadUserProfile();
  }
  getUser(): Observable<User> {
    // legacy callers -> redirect to cached loader
    return this.loadUserIfNeeded();
  }

  // Carrega /user/me apenas uma vez e cacheia em currentUserSubject
  loadUserIfNeeded(): Observable<User> {
    const cached = this.currentUserSubject.getValue();
    const token = this.getToken();
    if (cached && token && !this.jwtHelper.isTokenExpired(token)) {
      return of(cached);
    }
    if (!token) {
      return of(null as any);
    }
    return this.http.get<User>(`${this.apiUrl}/user/me`).pipe(
      tap((u) => {
        if (u) {
          localStorage.setItem('user', JSON.stringify(u));
          this.currentUserSubject.next(u);
        }
      })
    );
  }

  // Configura a renovação automática do token
  startTokenRefresh() {
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const exp = this.jwtHelper.getTokenExpirationDate(token)?.getTime() || 0;
      const delay = exp - Date.now() - 5 * 60 * 1000;
      if (delay > 0) {
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), delay);
      } else {
        this.logout();
      }
    } else {
      this.logout();
    }
  }

  // Renova o token automaticamente
  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return;
    }
    // Envia refresh token no Authorization header
    this.http
      .post<any>(
        `${this.apiUrl}/auth/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        }
      )
      .subscribe({
        next: (res) => {
          if (res?.accessToken) localStorage.setItem('token', res.accessToken);
          if (res?.refreshToken)
            localStorage.setItem('refreshToken', res.refreshToken);
          this.startTokenRefresh();
        },
        error: () => this.logout(),
      });
  }
}
