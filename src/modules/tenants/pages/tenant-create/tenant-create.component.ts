import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TenantsService } from '../../services/tenants.service';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentFrequency,
  PaymentStatusLabels,
  PaymentMethodLabels,
  PaymentFrequencyLabels,
} from '../../interfaces/tenant.enums';
import { CreateTenantDto } from '../../interfaces/tenant.interface';
import { ErrorHelper } from '../../../../app/core/helpers/error.helper';
import { PhoneMaskDirective } from '../../../../app/core/directives/phone-mask.directive';

@Component({
  selector: 'app-tenant-create',
  templateUrl: './tenant-create.component.html',
  styleUrls: ['./tenant-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PhoneMaskDirective,
  ],
})
export class TenantCreateComponent implements OnInit {
  tenantForm!: FormGroup;
  error: string | null = null;
  success = false;
  loading = false;

  // Enums para o template
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  PaymentFrequency = PaymentFrequency;

  // Labels para exibição
  paymentStatusOptions = Object.entries(PaymentStatusLabels).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  paymentMethodOptions = Object.entries(PaymentMethodLabels).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  paymentFrequencyOptions = Object.entries(PaymentFrequencyLabels).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  constructor(
    private fb: FormBuilder,
    private tenantsService: TenantsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    const oneYearFromToday = this.getOneYearFromTodayIsoDate();
    this.tenantForm = this.fb.group({
      code: [
        { value: this.generateTenantCode(), disabled: true },
        [Validators.minLength(3), Validators.maxLength(20)],
      ],
      companyName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      address: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200),
        ],
      ],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)],
      ],
      paymentStatus: [PaymentStatus.UNPAID, Validators.required],
      paymentMethod: [PaymentMethod.PIX, Validators.required],
      isActive: [true],
      paymentFrequency: [PaymentFrequency.MONTHLY, Validators.required],
      paymentDueDate: [oneYearFromToday, Validators.required],
      logo: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      description: ['', [Validators.minLength(10), Validators.maxLength(500)]],
    });
  }

  private getOneYearFromTodayIsoDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.tenantForm.valid) {
      this.loading = true;
      this.error = null;
      const raw = this.tenantForm.getRawValue();
      const formData: CreateTenantDto = {
        ...raw,
        paymentDueDate: new Date(raw.paymentDueDate),
      };

      this.tenantsService.createTenant(formData).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/tenants']);
          }, 2000); // Mostra sucesso por 2 segundos antes de navegar
        },
        error: (err) => {
          this.loading = false;
          this.success = false;
          this.error = ErrorHelper.getErrorMessage(err);
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.tenantForm.controls).forEach((key) => {
      const control = this.tenantForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.tenantForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} é obrigatório`;
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${
          field.errors['minlength'].requiredLength
        } caracteres`;
      if (field.errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} deve ter no máximo ${
          field.errors['maxlength'].requiredLength
        } caracteres`;
      if (field.errors['pattern'])
        return `${this.getFieldLabel(fieldName)} tem formato inválido`;
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      code: 'Código',
      companyName: 'Nome da Empresa',
      address: 'Endereço',
      phone: 'Telefone',
      paymentStatus: 'Status de Pagamento',
      paymentMethod: 'Método de Pagamento',
      paymentFrequency: 'Frequência de Pagamento',
      paymentDueDate: 'Data de Vencimento',
      logo: 'Logo',
      description: 'Descrição',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenantForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private generateTenantCode(): string {
    // TEN-<6 uppercase base36>
    const rand = Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const suffix = rand.substring(0, 6).padEnd(6, 'X');
    return `TEN-${suffix}`;
  }
}
