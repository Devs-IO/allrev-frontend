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
import { finalize } from 'rxjs/operators';

// Imports Ajustados para a Nova Estrutura
import { AuthService } from '../../../../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
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
    // Se já estiver logado, redireciona para o dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
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
            // Verifica se precisa trocar senha
            const mustChange = response.user?.mustChangePassword === true;

            if (mustChange) {
              this.router.navigate(['/change-password']);
            } else {
              // Sucesso: Redireciona para o Dashboard Administrativo
              this.router.navigate(['/home']);
            }
          },
          error: (error) => {
            console.error('Login error:', error);
            const backendMsg: string | undefined = error?.error?.message;

            // Tratamento de mensagens específicas do Backend (NestJS)
            if (
              backendMsg === 'user.not_found' ||
              backendMsg === 'Unauthorized'
            ) {
              this.errorMessage = 'E-mail ou senha incorretos.';
              return;
            }

            // Tratamento genérico por Status Code
            switch (error.status) {
              case 0:
                this.errorMessage = 'Sem conexão. Verifique sua internet.';
                break;
              case 401:
                this.errorMessage = 'Credenciais inválidas.';
                break;
              case 500:
                this.errorMessage = 'Erro no servidor. Tente mais tarde.';
                break;
              default:
                this.errorMessage = backendMsg || 'Erro inesperado ao entrar.';
            }
          },
        });
    } else {
      // Força a exibição dos erros se o usuário clicar sem preencher
      this.loginForm.markAllAsTouched();
    }
  }

  clearError() {
    this.errorMessage = '';
  }
}
