import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ToastService } from '../../../../../app/core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private readonly SUCCESS_REDIRECT_DELAY_MS = 1500; // Aumentei levemente para dar tempo de ler o toast

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch }
  );

  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  private passwordsMatch(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;
    this.success = false;

    // --- CORREÇÃO AQUI ---
    // O backend espera 'newPassword', não 'password'
    const payload = {
      newPassword: this.form.value.password,
    };
    // ---------------------

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.toast.success('Senha alterada com sucesso! Redirecionando...');

        // Redireciona para o login após alterar a senha
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }, this.SUCCESS_REDIRECT_DELAY_MS);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Erro ao alterar senha.';
        this.toast.error(this.error?.toString() || 'Erro ao alterar senha.');
      },
    });
  }
}
