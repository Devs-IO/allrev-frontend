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

  constructor(
    private fb: FormBuilder,
    private functionalitiesService: FunctionalitiesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadResponsibleUsers();

    // Re-validate defaultAssistantPrice when minimumPrice changes
    this.form.get('minimumPrice')?.valueChanges.subscribe(() => {
      this.form.get('defaultAssistantPrice')?.updateValueAndValidity();
    });
  }

  loadResponsibleUsers() {
    this.functionalitiesService.getResponsibleUsers().subscribe({
      next: (users) => {
        this.responsibleUsers = users;
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
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formValue = this.form.value;
    const dto = {
      name: formValue.name || '',
      description: formValue.description || undefined,
      minimumPrice: formValue.minimumPrice || 0,
      defaultAssistantPrice: formValue.defaultAssistantPrice || undefined,
      responsibleUserId: formValue.responsibleUserId || '',
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
