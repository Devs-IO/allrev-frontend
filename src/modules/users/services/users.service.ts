import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { CreateUserDto, ResponseUserDto } from '../types/user.dto';
import { AuthService } from '../../../app/core/services/auth.service';
import { User } from '../interfaces/user.interface';
import { Role } from '../../../app/core/enum/roles.enum';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = environment.apiUrl; // URL base da API
  private http = inject(HttpClient);

  constructor(private authService: AuthService) {}

  getUsers(): Observable<ResponseUserDto[]> {
    return this.authService.getUser().pipe(
      switchMap((user: User) => {
        if (user.role === Role.ADMIN) {
          return this.http.get<ResponseUserDto[]>(`${this.apiUrl}/user/all`);
        } else {
          return this.http.get<ResponseUserDto[]>(
            `${this.apiUrl}/user/children`
          );
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar roles do usuário:', err);
        return throwError(err);
      })
    );
  }

  getUserById(id: string): Observable<ResponseUserDto> {
    return this.http.get<ResponseUserDto>(`${this.apiUrl}/user/${id}`);
  }

  createUser(data: CreateUserDto): Observable<ResponseUserDto> {
    return this.http.post<ResponseUserDto>(
      `${this.apiUrl}/auth/register`,
      data
    );
  }

  updateUser(
    id: string,
    data: Partial<CreateUserDto>
  ): Observable<ResponseUserDto> {
    return this.http.put<ResponseUserDto>(`${this.apiUrl}/user/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/user/${id}`);
  }
}
