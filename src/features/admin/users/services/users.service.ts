import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, take, throwError } from 'rxjs';
import { CreateUserDto, ResponseUserDto } from '../types/user.dto';
import { AuthService } from '../../../../app/core/services/auth.service';
import { User } from '../interfaces/user.interface';
import { Role } from '../../../../app/core/enum/roles.enum';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getUsers(): Observable<ResponseUserDto[]> {
    // Usa currentUser$ com take(1) para pegar o valor atual e completar
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap((user: User | null) => {
        if (!user) {
          console.error('Usuário não autenticado');
          return throwError(() => new Error('Usuário não autenticado.'));
        }

        const userRole = String(user.role).toLowerCase();
        const isAdmin = userRole === 'admin';

        console.log(
          'UsersService.getUsers() - user.role:',
          user.role,
          'isAdmin:',
          isAdmin
        );

        if (isAdmin) {
          console.log('Chamando GET /users/all para ADMIN');
          return this.http.get<ResponseUserDto[]>(`${this.apiUrl}/users/all`);
        } else {
          console.log('Chamando GET /users/children para MANAGER');
          return this.http.get<ResponseUserDto[]>(
            `${this.apiUrl}/users/children`
          );
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar usuários:', err);
        return throwError(() => err);
      })
    );
  }

  getUserById(id: string): Observable<ResponseUserDto> {
    return this.http.get<ResponseUserDto>(`${this.apiUrl}/users/${id}`);
  }

  deleteUser(id: string): Observable<any> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap((user) => {
        // Se for Gestor, chama rota de remover assistente
        if (user?.role === Role.MANAGER_REVIEWERS) {
          return this.http.delete(`${this.apiUrl}/users/assistants/${id}`);
        }
        // Se for Admin, chama rota de remover global
        return this.http.delete(`${this.apiUrl}/users/${id}`);
      })
    );
  }

  createUser(data: CreateUserDto): Observable<ResponseUserDto> {
    return this.http.post<ResponseUserDto>(`${this.apiUrl}/users`, data);
  }

  updateUser(
    id: string,
    data: Partial<CreateUserDto>
  ): Observable<ResponseUserDto> {
    return this.http.put<ResponseUserDto>(`${this.apiUrl}/users/${id}`, data);
  }

  getAvailableRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/users/available-roles`);
  }
}
