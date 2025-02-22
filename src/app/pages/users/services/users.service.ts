import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserProfile } from '../../../core/interfaces/user-profile.interface';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/interfaces/user.interface';
import { Role } from '../../../core/enum/roles.enum';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = environment.apiUrl; // URL base da API
  private http = inject(HttpClient);

  constructor(private authService: AuthService) { }
  

  getUsers(): Observable<UserProfile[]> {
    return this.authService.getUser().pipe(
      switchMap((user: User) => {
        if (user.role === Role.ADMIN) {
          return this.http.get<UserProfile[]>(`${this.apiUrl}/user/all`);
        } else {
          return this.http.get<UserProfile[]>(`${this.apiUrl}/user/children`);
        }
      }),
      catchError((err) => {
        console.error('Erro ao buscar roles do usuário:', err);
        return throwError(err);
      })
    );
  }

}
