import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FunctionalitiesService } from '../../services/functionalities.service';
import { ResponsibleUser } from '../../interfaces/functionalities.interface';
import { AuthService } from '../../../../../app/core/services/auth.service';

// Custom validator to check if defaultAssistantPrice is not greater than minimumPrice
function assistantPriceValidator(control: AbstractControl) {
  const formGroup = control.parent;
  if (!formGroup) return null;

  const minimumPrice = formGroup.get('minimumPrice')?.value;
  const defaultAssistantPrice = control.value;

  if (
    defaultAssistantPrice &&
    minimumPrice &&
    defaultAssistantPrice > minimumPrice
  ) {
    return { max: true };
  }

  return null;
}

@Component({
  selector: 'app-functionality-create',
  templateUrl: './functionalities-create.component.html',
  styleUrls: ['./functionalities-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class FunctionalitiesCreateComponent implements OnInit {
  form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    description: [''],
    minimumPrice: [null, [Validators.required, Validators.min(0.01)]],
    defaultAssistantPrice: [null, [assistantPriceValidator]],
    responsibleUserId: ['', Validators.required],
    isActive: [true], // true = ACTIVE, false = INACTIVE
  });

  loading = false;
  error = '';
  success = '';
  responsibleUsers: ResponsibleUser[] = [];
  loggedUserId: string = '';
  loggedUserName: string = '';

  constructor(
    private fb: FormBuilder,
    private functionalitiesService: FunctionalitiesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtém usuário logado e então carrega lista de responsáveis
    this.authService.userProfile$.subscribe((profile) => {
      if (profile) {
        this.loggedUserId = profile.id;
        this.loggedUserName = profile.name;
        // Se ainda não definido um responsável na form, pré-seleciona o próprio usuário
        if (!this.form.get('responsibleUserId')?.value) {
          this.form.patchValue({ responsibleUserId: this.loggedUserId });
        }
      }
      this.loadResponsibleUsers();
    });

    // Re-validate defaultAssistantPrice when minimumPrice changes
    this.form.get('minimumPrice')?.valueChanges.subscribe(() => {
      this.form.get('defaultAssistantPrice')?.updateValueAndValidity();
    });
  }

  loadResponsibleUsers() {
    this.functionalitiesService.getResponsibleUsers().subscribe({
      next: (users) => {
        this.responsibleUsers = users || [];
        // Garante que o usuário logado aparece na lista (caso não venha da API)
        if (
          this.loggedUserId &&
          !this.responsibleUsers.some((u) => u.id === this.loggedUserId)
        ) {
          this.responsibleUsers = [
            { id: this.loggedUserId, name: this.loggedUserName || 'Você' },
            ...this.responsibleUsers,
          ];
        }
        // Se form estiver vazio (ou usuário não selecionou), atribui logado
        const current = this.form.get('responsibleUserId')?.value;
        if (!current && this.loggedUserId) {
          this.form.patchValue({ responsibleUserId: this.loggedUserId });
        }
      },
      error: (err) => {
        console.error('Erro ao carregar usuários responsáveis:', err);
        this.error = 'Erro ao carregar lista de responsáveis. Tente novamente.';
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // fallback: se responsável vazio mas temos usuário logado, atribui e revalida
      if (!this.form.value.responsibleUserId && this.loggedUserId) {
        this.form.patchValue({ responsibleUserId: this.loggedUserId });
        this.form.updateValueAndValidity();
      }
      if (this.form.invalid) return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formValue = this.form.value;
    const responsibleId =
      formValue.responsibleUserId || this.loggedUserId || '';
    const dto = {
      name: formValue.name || '',
      description: formValue.description || undefined,
      minimumPrice: formValue.minimumPrice || 0,
      defaultAssistantPrice: formValue.defaultAssistantPrice || undefined,
      responsibleUserId: responsibleId,
      status: formValue.isActive
        ? 'ACTIVE'
        : ('INACTIVE' as 'ACTIVE' | 'INACTIVE'),
    };

    this.functionalitiesService.create(dto).subscribe({
      next: () => {
        this.success = 'Funcionalidade criada com sucesso!';
        setTimeout(() => {
          this.router.navigate(['/functionalities']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erro ao criar funcionalidade:', err);
        this.error =
          err.error?.message ||
          'Erro ao criar funcionalidade. Tente novamente.';
        this.loading = false;
      },
      complete: () => {
        if (!this.success) {
          this.loading = false;
        }
      },
    });
  }
}
