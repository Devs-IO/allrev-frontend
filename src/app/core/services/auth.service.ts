import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map, switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Imports de Interfaces e Enums
import { UserProfile } from '../../../features/admin/users/interfaces/user-profile.interface';
import { User } from '../../../features/admin/users/interfaces/user.interface';
import { Role } from '../enum/roles.enum'; // Certifique-se que o caminho está correto

// Interface para tipar a resposta do Login
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
  // LOGIN CLIENTE
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
  // GESTÃO DE SESSÃO (CORRIGIDA)
  // ============================================================

  /**
   * Enriquece o objeto User com IDs de contexto baseados nas roles.
   * Usa (user as any) para evitar erro de TS se a interface User não tiver os campos opcionais ainda.
   */
  private enrichUserWithTenantContext(user: User): User {
    const u = user as any; // Casting para flexibilidade

    // Limpa contextos anteriores para evitar lixo
    u.currentTenantIdGerente = undefined;
    u.currentTenantIdAssistentes = undefined;

    // Extrai currentTenantIdGerente do array de tenants
    if (user.tenants && Array.isArray(user.tenants)) {
      const managerTenant = user.tenants.find(
        (t) =>
          t.role === Role.MANAGER_REVIEWERS ||
          t.role === Role.MANAGER_REVIEWERS.toString()
      );
      if (managerTenant) {
        u.currentTenantIdGerente = managerTenant.tenantId;
      }
    }

    // Extrai currentTenantIdAssistentes
    if (user.tenants && Array.isArray(user.tenants)) {
      const assistantTenants = user.tenants
        .filter(
          (t) =>
            t.role === Role.ASSISTANT_REVIEWERS ||
            t.role === Role.ASSISTANT_REVIEWERS.toString()
        )
        .map((t) => t.tenantId);

      if (assistantTenants.length > 0) {
        u.currentTenantIdAssistentes = assistantTenants;
      }
    }

    return u as User;
  }

  private setSession(response: AuthResponse): void {
    if (response?.accessToken && response?.user) {
      // Normaliza role para evitar divergência de casing (ex: 'CLIENT' -> 'client')
      const normalizedRole = (response.user.role as unknown as string)
        ?.toString()
        .toLowerCase();
      const roleMap: Record<string, Role> = {
        admin: Role.ADMIN,
        user: Role.USER,
        manager_reviewers: Role.MANAGER_REVIEWERS,
        assistant_reviewers: Role.ASSISTANT_REVIEWERS,
        client: Role.CLIENT,
        none: Role.NONE,
      };
      const mappedRole = normalizedRole && roleMap[normalizedRole];
      if (mappedRole) {
        (response.user as any).role = mappedRole;
      }

      // Enriquece o usuário com contexto de tenant
      const enrichedUser = this.enrichUserWithTenantContext(response.user);

      localStorage.setItem('user', JSON.stringify(enrichedUser));
      localStorage.setItem('token', response.accessToken);

      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      this.currentUserSubject.next(enrichedUser);
      this.startTokenRefresh();
    } else {
      throw new Error('Resposta de login inválida.');
    }
  }

  logout() {
    // 1. Identificar o tipo de usuário ANTES de limpar os dados para redirecionar corretamente
    const user = this.currentUserSubject.value;
    const isClient =
      user?.role === Role.CLIENT || user?.role === Role.CLIENT.toString();

    // 2. Limpeza
    this.stopRefreshToken();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    this.currentUserSubject.next(null);
    this.profileSubject.next(null);

    // 3. Redirecionamento Inteligente
    if (isClient) {
      this.router.navigate(['/portal/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // ============================================================
  // PERFIL & UTILITÁRIOS
  // ============================================================
  getUserCached(): Observable<User | null> {
    const user = this.currentUserSubject.value;
    if (user) {
      return of(user);
    }

    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap((u) => {
        // Precisamos enriquecer aqui também, caso o usuário dê F5 na página
        const enriched = this.enrichUserWithTenantContext(u);
        this.currentUserSubject.next(enriched);
        localStorage.setItem('user', JSON.stringify(enriched));
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

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
  // REFRESH TOKEN
  // ============================================================
  private stopRefreshToken() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  startTokenRefresh() {
    this.stopRefreshToken();

    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      const exp = expirationDate ? expirationDate.getTime() : 0;

      // Renova 2 minutos antes de expirar
      const delay = exp - Date.now() - 2 * 60 * 1000;

      if (delay > 0) {
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), delay);
      } else {
        this.refreshToken();
      }
    }
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
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
            this.startTokenRefresh();
          }
        },
        error: () => {
          this.logout();
        },
      });
  }

  changePassword(data: any) {
    const user = this.currentUserSubject.value;
    const isClient =
      user?.role === Role.CLIENT || user?.role === Role.CLIENT.toString();
    const path = isClient
      ? '/auth/client/change-password'
      : '/auth/change-password';
    return this.http.put(`${this.apiUrl}${path}`, data);
  }
}
