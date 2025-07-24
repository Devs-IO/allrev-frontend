import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../../modules/users/interfaces/user-profile.interface';
import { User } from '../../../modules/users/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl; // URL base da API
  private currentUserSubject: BehaviorSubject<any>;
  private refreshTokenTimeout: any;
  public currentUser: Observable<any>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    // Inicia o estado do usuário com o que está no localStorage
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('user') || '{}')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Login do usuário
  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        map((response) => {
          // Salva o JWT no localStorage
          if (response && response.accessToken) {
            // Verifica se a resposta contém o token
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.accessToken); // Salva o token separadamente
            this.currentUserSubject.next(response.user);
            this.startTokenRefresh(); // Inicia a renovação automática do token

            return response;
          } else {
            throw new Error('Token não encontrado na resposta de login.');
          }
        })
      );
  }

  // Logout do usuário
  logout() {
    // Remove o usuário e o token do localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    clearTimeout(this.refreshTokenTimeout);
    this.router.navigate(['/login']);
  }

  // Obtém o token atual
  getToken() {
    return localStorage.getItem('token');
  }

  // Verifica se o usuário está autenticado
  isAuthenticated() {
    const token = this.getToken();
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/user/profile`);
  }

  getUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/me`);
  }

  // Configura a renovação automática do token
  startTokenRefresh() {
    const token = this.getToken();

    if (token && this.jwtHelper.isTokenExpired(token) === false) {
      const expiresAt =
        this.jwtHelper.getTokenExpirationDate(token)?.getTime() || 0;
      const now = Date.now();

      // Define o tempo para renovar o token (5 minutos antes de expirar)
      const delay = expiresAt - now - 5 * 60 * 1000;

      if (delay > 0) {
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), delay);
      } else {
        console.error(
          'Token já expirado ou com tempo incorreto, realizando logout.'
        );
        this.logout(); // Faz logout se o token já estiver expirado
      }
    } else {
      console.error('Token inválido ou ausente. O usuário será deslogado.');
      this.logout();
    }
  }

  // Renova o token automaticamente
  refreshToken() {
    this.http.post<any>(`${this.apiUrl}/auth/refresh`, {}).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token); // Salva o novo token
        this.startTokenRefresh(); // Reprograma a próxima renovação
      },
      error: () => {
        this.logout(); // Faz logout em caso de erro
      },
    });
  }
}
