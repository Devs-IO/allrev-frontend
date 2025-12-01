import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../app/core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './portal-login.component.html',
  styleUrls: ['./portal-login.component.scss'],
})
export class PortalLoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/portal/home']);
    }
  }

  login() {
    if (this.loading) return;

    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService
        .login(email!, password!)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (response) => {
            const mustChange = response.user?.mustChangePassword === true;

            if (mustChange) {
              this.router.navigate(['/change-password']);
            } else {
              this.router.navigate(['/portal/home']);
            }
          },
          error: (error) => {
            console.error('Portal login error:', error);
            const backendMsg: string | undefined = error?.error?.message;

            if (
              backendMsg === 'user.not_found' ||
              backendMsg === 'Unauthorized'
            ) {
              this.errorMessage = 'Usuário não encontrado ou senha inválida.';
              return;
            }

            switch (error.status) {
              case 0:
                this.errorMessage = 'Erro de conexão. Verifique sua internet.';
                break;
              case 401:
                this.errorMessage = 'E-mail ou senha incorretos.';
                break;
              case 500:
                this.errorMessage =
                  'Erro interno do servidor. Tente mais tarde.';
                break;
              default:
                this.errorMessage =
                  error.error?.message || 'Erro inesperado ao tentar entrar.';
            }
          },
        });
    }
  }

  clearError() {
    this.errorMessage = '';
  }
}
