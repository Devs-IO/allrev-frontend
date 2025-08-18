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
import { AuthService } from '../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true, // Marcando como standalone
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // Importando os módulos necessários
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
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

  ngOnInit(): void {}

  login() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;
      this.authService.login(email!, password!).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.isLoading = false;
          const mustChange =
            response?.payload?.mustChangePassword === true ||
            response?.user?.mustChangePassword === true;
          if (mustChange) {
            this.router.navigate(['/change-password']);
          } else {
            // prefer dashboard if present, fallback to home
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;

          // Tratamento de diferentes tipos de erro
          if (error.status === 0) {
            this.errorMessage =
              'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (error.status === 401) {
            this.errorMessage = 'Email ou senha incorretos.';
          } else if (error.status === 500) {
            this.errorMessage =
              'Erro interno do servidor. Tente novamente mais tarde.';
          } else {
            this.errorMessage =
              error.error?.message || 'Erro inesperado. Tente novamente.';
          }
        },
      });
    }
  }

  clearError() {
    this.errorMessage = '';
  }
}
