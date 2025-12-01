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

    // Prepara o payload correto (Objeto ao invés de string simples)
    const payload = {
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword, // Enviando ambos caso o DTO exija validação no back
    };

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.toast.success('Senha alterada com sucesso! Redirecionando...');

        setTimeout(
          () => this.router.navigate(['/home']), // Redireciona para Home após trocar
          this.SUCCESS_REDIRECT_DELAY_MS
        );
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        // Tratamento de erro aprimorado
        const msg = err?.error?.message;
        if (Array.isArray(msg)) {
          this.error = msg.join(', '); // Se for erro de validação (array de strings)
        } else {
          this.error = msg || 'Erro ao alterar a senha. Tente novamente.';
        }
      },
    });
  }
}
