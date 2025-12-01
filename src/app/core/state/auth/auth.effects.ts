import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import * as AuthActions from './auth.actions';
import { catchError, map, exhaustMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Role } from '../../enum/roles.enum';
import { ToastService } from '../../services/toast.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // --- Effect para Login Administrativo ---
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginRequest),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) => {
            const msg = error.error?.message || 'Falha na autenticação';
            this.toast.error(msg); // Feedback visual
            return of(AuthActions.loginFailure({ error: msg }));
          })
        )
      )
    )
  );

  // --- Effect para Login do Cliente ---
  loginClient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginClientRequest),
      exhaustMap(({ email, password }) =>
        this.authService.loginClient({ email, password }).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) => {
            const msg = error.error?.message || 'Falha no login do portal';
            this.toast.error(msg);
            return of(AuthActions.loginFailure({ error: msg }));
          })
        )
      )
    )
  );

  // --- Effect de Redirecionamento após Sucesso ---
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          // Lógica de Redirecionamento baseada na Role
          if (response.user.mustChangePassword) {
            this.router.navigate(['/change-password']);
          } else if (response.user.role === Role.CLIENT) {
            this.router.navigate(['/portal/home']);
          } else {
            this.router.navigate(['/home']);
          }
        })
      ),
    { dispatch: false } // Não dispara nova action
  );

  // --- Effect de Logout ---
  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout(); // Limpa localStorage via service
          // O service já redireciona, mas garantimos aqui
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );
}
