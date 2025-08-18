import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TenantsService } from '../../../tenants/services/tenants.service';
import { UsersService } from '../../services/users.service';
import { CreateUserDto } from '../../types/user.dto';
import { AuthService } from '../../../../app/core/services/auth.service';
import { Role, RoleLabels } from '../../interfaces/user.enums';
import { ErrorHelper } from '../../../../app/core/helpers/error.helper';
import { PhoneMaskDirective } from '../../../../app/core/directives/phone-mask.directive';

// No password fields anymore; backend generates a temporary password.

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PhoneMaskDirective,
  ],
})
export class UserCreateComponent implements OnInit {
  userForm!: FormGroup;
  error: string | null = null;
  success = false;
  loading = false;
  tenants: any[] = [];
  isAdmin = false;
  tenantName = '';
  currentUserRole = '';

  // Enums para o template
  Role = Role;

  // Labels para exibição
  roleOptions = Object.entries(RoleLabels).map(([value, label]) => ({
    value,
    label,
  }));

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    private tenantsService: TenantsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.checkAdminAndTenant();
    this.loadAvailableRoles();
  }

  private initializeForm() {
    this.userForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)],
      ],
      // Default role prefilled; will be kept if allowed in available roles
      role: [Role.MANAGER_REVIEWERS, Validators.required],
      address: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200),
        ],
      ],
      tenantId: [''], // Validators will be added conditionally
      isActive: [true],
      photo: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  private checkAdminAndTenant() {
    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        console.log(user);
        this.currentUserRole = user.role;
        this.isAdmin = user.role === Role.ADMIN;

        // Configure tenantId validation based on user role
        const tenantIdControl = this.userForm?.get('tenantId');
        if (this.isAdmin) {
          // Admin users: field is required and enabled, show tenant selection
          tenantIdControl?.setValidators([Validators.required]);
          tenantIdControl?.enable();
          this.loadTenants();
        } else if (user.tenant?.id) {
          // Non-admin users: field is not required and disabled, pre-filled with user's tenant
          tenantIdControl?.clearValidators();
          this.tenantName = user.tenant.companyName || '';
          tenantIdControl?.setValue(user.tenant.id);
          tenantIdControl?.disable();
        } else {
          // Non-admin users without tenant: show error
          this.error =
            'Usuário não possui empresa associada. Contate o administrador.';
          tenantIdControl?.clearValidators();
          tenantIdControl?.disable();
        }
        tenantIdControl?.updateValueAndValidity();
      },
      error: (err) => {
        this.error = ErrorHelper.getErrorMessage(err);
      },
    });
  }

  private loadTenants() {
    this.tenantsService.getTenants().subscribe({
      next: (tenants: any[]) => {
        this.tenants = tenants;
        // Auto-select the most recently created tenant if admin
        const tenantIdControl = this.userForm.get('tenantId');
        if (
          this.isAdmin &&
          tenantIdControl &&
          !tenantIdControl.value &&
          Array.isArray(tenants) &&
          tenants.length
        ) {
          const latest = tenants.reduce((acc: any, cur: any) => {
            const accDate = new Date(acc?.createdAt || 0).getTime();
            const curDate = new Date(cur?.createdAt || 0).getTime();
            return curDate > accDate ? cur : acc;
          }, tenants[0]);
          if (latest?.id) {
            tenantIdControl.setValue(latest.id);
            this.tenantName = latest.companyName || '';
          }
        }
      },
      error: (err) => {
        this.error = ErrorHelper.getErrorMessage(err);
        this.tenants = [];
      },
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;
      this.success = false;

      // Get form value and handle disabled tenantId field
      const formValue = this.userForm.value;

      // Build payload without password fields (backend generates password)
      const { password, confirmPassword, ...rest } = formValue as any;
      const formData: CreateUserDto = { ...rest } as CreateUserDto;

      // Para usuários não-admin, o tenantId pode estar disabled, então pegamos do getRawValue()
      if (!this.isAdmin && this.userForm.get('tenantId')?.disabled) {
        formData.tenantId = this.userForm.getRawValue().tenantId;
      }

      this.usersService.createUser(formData).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 2000);
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
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.userForm.get(fieldName);
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
      if (field.errors['email'])
        return `${this.getFieldLabel(fieldName)} deve ser um email válido`;
    }

    // No password confirmation validation anymore

    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      role: 'Função',
      // password fields removed
      address: 'Endereço',
      tenantId: 'Empresa',
      photo: 'Foto',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    const hasFieldError = !!(field?.errors && field.touched);

    // No confirmPassword checks

    return hasFieldError;
  }

  openTenantForm() {
    this.router.navigate(['/tenants/create']);
  }

  loadAvailableRoles() {
    this.usersService.getAvailableRoles().subscribe({
      next: (roles: Role[]) => {
        this.roleOptions = roles.map((role) => ({
          value: role,
          label: RoleLabels[role] || role,
        }));
        // Ensure selected role is valid: prefer MANAGER_REVIEWERS if available, otherwise first available
        const roleCtrl = this.userForm.get('role');
        const hasManager = roles.includes(Role.MANAGER_REVIEWERS);
        if (roleCtrl) {
          const current = roleCtrl.value as Role | '';
          if (!current || (current && !roles.includes(current))) {
            roleCtrl.setValue(
              hasManager ? Role.MANAGER_REVIEWERS : roles[0] ?? ''
            );
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar roles disponíveis:', err);
        this.error = 'Erro ao carregar opções de funções';
      },
    });
  }

  getAvailableRoles() {
    // Método mantido por compatibilidade, mas agora apenas retorna as opções carregadas
    return this.roleOptions;
  }
}
