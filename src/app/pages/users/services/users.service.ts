import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateUserDto, ResponseUserDto } from '../../../core/dtos/user.dto';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/interfaces/user.interface';
import { Role } from '../../../core/enum/roles.enum';

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
