import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantsService } from '../../services/tenants.service';
import { Tenant, CreateTenantDto } from '../../interfaces/tenant.interface';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentFrequency,
  PaymentStatusLabels,
  PaymentMethodLabels,
  PaymentFrequencyLabels,
} from '../../interfaces/tenant.enums';
import { ErrorHelper } from '../../../../app/core/helpers/error.helper';

declare var bootstrap: any;

@Component({
  selector: 'app-tenant-edit',
  templateUrl: './tenant-edit.component.html',
  styleUrls: ['./tenant-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TenantEditComponent implements OnInit {
  tenantForm!: FormGroup;
  originalFormValues: any = null;
  tenant: Tenant | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  // Enums para os selects
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
    private route: ActivatedRoute,
    private router: Router,
    private tenantsService: TenantsService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTenant(id);
    } else {
      this.error = 'ID da empresa não fornecido';
      this.loading = false;
    }
  }

  initializeForm(): void {
    this.tenantForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      paymentStatus: [PaymentStatus.PENDING, Validators.required],
      paymentMethod: [PaymentMethod.PIX, Validators.required],
      paymentFrequency: [PaymentFrequency.MONTHLY, Validators.required],
      paymentDueDate: ['', Validators.required],
      isActive: [true],
      description: [''],
    });
  }

  loadTenant(id: string): void {
    this.tenantsService.getTenant(id).subscribe({
      next: (data: Tenant) => {
        this.tenant = data;
        this.populateForm(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresa:', err);
        this.error = ErrorHelper.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  populateForm(tenant: Tenant): void {
    const formValues = {
      code: tenant.code,
      companyName: tenant.companyName,
      address: tenant.address,
      phone: tenant.phone,
      paymentStatus: tenant.paymentStatus,
      paymentMethod: tenant.paymentMethod,
      paymentFrequency: tenant.paymentFrequency,
      paymentDueDate: this.formatDateForInput(tenant.paymentDueDate),
      isActive: tenant.isActive,
      description: tenant.description || '',
    };
    this.tenantForm.patchValue(formValues);
    // Desabilitar campos code e companyName
    this.tenantForm.get('code')?.disable();
    this.tenantForm.get('companyName')?.disable();
    // Salvar valores originais para comparação
    this.originalFormValues = { ...formValues };
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.tenantForm.valid && this.tenant && this.hasFormChanged()) {
      // Mostrar modal de confirmação
      const modalEl = document.getElementById('confirmEditModal');
      if (modalEl) {
        const confirmModal = new bootstrap.Modal(modalEl);
        confirmModal.show();
      } else {
        // fallback: submit direto se modal não existe
        this.confirmSave();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  confirmSave(): void {
    if (this.tenantForm.valid && this.tenant) {
      this.saving = true;

      // Fechar modal de confirmação
      const modalEl = document.getElementById('confirmEditModal');
      if (modalEl) {
        const confirmModal = bootstrap.Modal.getInstance(modalEl);
        if (confirmModal) confirmModal.hide();
      }

      const formData: Partial<CreateTenantDto> = {
        ...this.tenantForm.getRawValue(),
        paymentDueDate: new Date(this.tenantForm.getRawValue().paymentDueDate),
      };

      this.tenantsService.updateTenant(this.tenant.id, formData).subscribe({
        next: () => {
          this.saving = false;
          this.success = 'Empresa atualizada com sucesso!';
          setTimeout(() => {
            this.router.navigate(['/tenants']);
          }, 1500);
        },
        error: (err) => {
          console.error('Erro ao atualizar empresa:', err);
          this.error = ErrorHelper.getErrorMessage(err);
          this.saving = false;
        },
      });
    }
  }

  redirectToList(): void {
    // Fechar modal de sucesso
    const successModal = bootstrap.Modal.getInstance(
      document.getElementById('successModal')
    );
    successModal.hide();

    // Navegar para a listagem
    this.router.navigate(['/tenants']);
  }

  markFormGroupTouched(): void {
    Object.keys(this.tenantForm.controls).forEach((key) => {
      const control = this.tenantForm.get(key);
      control?.markAsTouched();
    });
  }

  hasFormChanged(): boolean {
    if (!this.originalFormValues) {
      return false;
    }
    const currentValues = this.tenantForm.getRawValue();
    // Comparar cada campo
    return Object.keys(this.originalFormValues).some((key) => {
      return this.originalFormValues[key] !== currentValues[key];
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

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      code: 'Código',
      companyName: 'Nome da Empresa',
      address: 'Endereço',
      phone: 'Telefone',
      paymentStatus: 'Status do Pagamento',
      paymentMethod: 'Método de Pagamento',
      paymentFrequency: 'Frequência de Pagamento',
      paymentDueDate: 'Data de Vencimento',
      description: 'Descrição',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tenantForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  cancel(): void {
    this.router.navigate(['/tenants']);
  }
}
