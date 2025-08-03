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

@Component({
  selector: 'app-tenant-edit',
  templateUrl: './tenant-edit.component.html',
  styleUrls: ['./tenant-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TenantEditComponent implements OnInit {
  tenantForm!: FormGroup;
  tenant: Tenant | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  // Enums para os selects
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  PaymentFrequency = PaymentFrequency;

  // Arrays para iteração no template
  paymentStatusOptions = Object.keys(PaymentStatus);
  paymentMethodOptions = Object.keys(PaymentMethod);
  paymentFrequencyOptions = Object.keys(PaymentFrequency);

  // Labels
  paymentStatusLabels = PaymentStatusLabels;
  paymentMethodLabels = PaymentMethodLabels;
  paymentFrequencyLabels = PaymentFrequencyLabels;

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
        this.error = 'Erro ao carregar dados da empresa';
        this.loading = false;
      },
    });
  }

  populateForm(tenant: Tenant): void {
    this.tenantForm.patchValue({
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
    });
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.tenantForm.valid && this.tenant) {
      this.saving = true;

      const formData: Partial<CreateTenantDto> = {
        ...this.tenantForm.value,
        paymentDueDate: new Date(this.tenantForm.value.paymentDueDate),
      };

      this.tenantsService.updateTenant(this.tenant.id, formData).subscribe({
        next: () => {
          alert('Empresa atualizada com sucesso!');
          this.router.navigate(['/tenants', this.tenant!.id]);
        },
        error: (err) => {
          console.error('Erro ao atualizar empresa:', err);
          alert('Erro ao atualizar empresa. Tente novamente.');
          this.saving = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.tenantForm.controls).forEach((key) => {
      const control = this.tenantForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.tenantForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} é obrigatório`;
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${
          field.errors['minlength'].requiredLength
        } caracteres`;
      if (field.errors['email']) return 'Email deve ter um formato válido';
    }
    return '';
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

  goBack(): void {
    if (this.tenant) {
      this.router.navigate(['/tenants', this.tenant.id]);
    } else {
      this.router.navigate(['/tenants']);
    }
  }

  cancel(): void {
    this.goBack();
  }
}
