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

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class UserCreateComponent implements OnInit {
  userForm!: FormGroup;
  error: string | null = null;
  success = false;
  loading = false;
  tenants: any[] = [];
  isAdmin = false;
  tenantName = '';

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
    this.checkAdminAndTenant();
    this.initializeForm();
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
      role: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
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
      tenantId: ['', this.isAdmin ? Validators.required : []],
      isActive: [true],
      photo: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  private checkAdminAndTenant() {
    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        console.log(user);
        this.isAdmin = user.role === 'Administrador';
        if (this.isAdmin) {
          this.loadTenants();
        } else if (user.tenant?.id) {
          this.tenantName = user.tenant.companyName || '';
          this.userForm?.get('tenantId')?.setValue(user.tenant.id);
        }
      },
      error: () => {
        this.error = 'Erro ao carregar dados do usuário.';
      },
    });
  }

  private loadTenants() {
    this.tenantsService.getTenants().subscribe({
      next: (tenants: any[]) => (this.tenants = tenants),
      error: () => {
        this.error = 'Erro ao carregar lista de empresas.';
        this.tenants = [];
      },
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      this.error = null;
      this.success = false;

      const formData: CreateUserDto = {
        ...this.userForm.value,
      };

      this.usersService.createUser(formData).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.success = false;
          this.error =
            error.error?.error?.message ||
            'Erro ao criar usuário. Tente novamente.';
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
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      role: 'Função',
      password: 'Senha',
      address: 'Endereço',
      tenantId: 'Empresa',
      photo: 'Foto',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  openTenantForm() {
    this.router.navigate(['/tenants/create']);
  }

  getAvailableRoles() {
    if (this.isAdmin) {
      return this.roleOptions;
    }
    // Se não for admin, exibe apenas as roles que não são admin
    return this.roleOptions.filter(
      (role) =>
        ![Role.ADMIN, Role.MANAGER_REVIEWERS].includes(role.value as Role)
    );
  }
}
