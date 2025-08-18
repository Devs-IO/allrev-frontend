import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';
import { ToastService } from '../../../app/core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private readonly SUCCESS_REDIRECT_DELAY_MS = 800;
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

    this.authService
      .changePassword(this.form.value.password as string)
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          this.toast.success('Senha alterada com sucesso');
          setTimeout(
            () => this.router.navigate(['/']),
            this.SUCCESS_REDIRECT_DELAY_MS
          );
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Erro ao alterar a senha.';
          this.toast.error('Erro ao alterar senha');
        },
      });
  }
}
