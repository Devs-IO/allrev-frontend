import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto, ResponseUserDto } from '../../types/user.dto';
import { Role, RoleLabels } from '../../interfaces/user.enums';
import { AuthService } from '../../../../app/core/services/auth.service';
import { ErrorHelper } from '../../../../app/core/helpers/error.helper';
import { TenantsService } from '../../../tenants/services/tenants.service';
import { PhoneMaskDirective } from '../../../../app/core/directives/phone-mask.directive';

declare var bootstrap: any;

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PhoneMaskDirective,
  ],
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  originalFormValues: any = null;
  user: ResponseUserDto | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  isAdmin = false;
  tenantName = '';
  tenants: any[] = [];
  currentUserRole = '';
  isEditingAdminUser = false;

  // Role options (carregado do backend)
  roleOptions: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private authService: AuthService,
    private tenantsService: TenantsService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Verificar se é admin e obter roles disponíveis
    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        this.currentUserRole = user.role;
        this.isAdmin = user.role === Role.ADMIN;
        this.loadAvailableRoles();
      },
      error: () => {
        this.isAdmin = false;
        this.loadAvailableRoles();
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.error = 'ID do usuário não fornecido';
      this.loading = false;
    }
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]], // Será desabilitado depois
      phone: ['', [Validators.required]],
      role: ['', [Validators.required]],
      address: ['', [Validators.required]],
      tenantId: [''], // Validators serão adicionados condicionalmente
      isActive: [true],
      currentPassword: [''], // Senha atual para confirmar mudanças
      password: [''], // Nova senha (opcional)
      confirmPassword: [''], // Confirmação da nova senha
    });
  }

  loadAvailableRoles() {
    this.usersService.getAvailableRoles().subscribe({
      next: (roles: Role[]) => {
        this.roleOptions = roles.map((role) => ({
          value: role,
          label: RoleLabels[role] || role,
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar roles disponíveis:', err);
        this.error = 'Erro ao carregar opções de funções';
      },
    });
  }

  loadUser(id: string): void {
    this.usersService.getUserById(id).subscribe({
      next: (data: ResponseUserDto) => {
        this.user = data;
        this.populateForm(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        this.error = ErrorHelper.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  populateForm(user: ResponseUserDto): void {
    // Ajuste simplificado: usamos tenantId direto se existir
    if ((user as any).tenant?.id) {
      this.tenantName = (user as any).tenant.companyName || 'Não informado';
      this.userForm.get('tenantId')?.setValue((user as any).tenant.id);
    } else if ((user as any).tenantId) {
      this.tenantName = (user as any).tenantCompanyName || 'Não informado';
      this.userForm.get('tenantId')?.setValue((user as any).tenantId);
    } else {
      this.tenantName = 'Não informado';
    }

    const formValues = {
      name: user.name,
      email: user.email,
      phone: (user as any).phone || '',
      role: user.role,
      address: (user as any).address || '',
      tenantId: this.userForm.get('tenantId')?.value,
      isActive:
        (user as any).isActive !== undefined ? (user as any).isActive : true,
      currentPassword: '',
      password: '',
      confirmPassword: '',
    };

    this.userForm.patchValue(formValues);
    this.userForm.get('email')?.disable();

    // Sempre desabilitar tenant (não editável após criação)
    const tenantIdControl = this.userForm.get('tenantId');
    tenantIdControl?.disable();

    // Se não for admin, bloquear mudança de role
    if (!this.isAdmin) {
      this.userForm.get('role')?.disable();
    }

    // Admin user cannot be deactivated: disable isActive toggle when editing ADMIN user
    this.isEditingAdminUser = user.role === Role.ADMIN;
    if (this.isEditingAdminUser) {
      this.userForm.get('isActive')?.disable();
    }

    this.originalFormValues = { ...formValues };
  }

  onSubmit(): void {
    if (this.userForm.valid && this.user) {
      // Se está alterando senha, verificar se senha atual foi fornecida
      const password = this.userForm.get('password')?.value;
      const currentPassword = this.userForm.get('currentPassword')?.value;

      if (password && !currentPassword) {
        this.error = 'Para alterar a senha, você deve informar a senha atual';
        return;
      }

      // Mostrar modal de confirmação
      const confirmModal = new bootstrap.Modal(
        document.getElementById('confirmEditModal')
      );
      confirmModal.show();
    } else {
      this.markFormGroupTouched();
    }
  }

  confirmSave(): void {
    if (this.userForm.valid && this.user) {
      this.saving = true;
      const confirmModal = bootstrap.Modal.getInstance(
        document.getElementById('confirmEditModal')
      );
      confirmModal.hide();

      const rawFormData = this.userForm.getRawValue();
      const formData: Partial<CreateUserDto> = {
        name: rawFormData.name,
        phone: rawFormData.phone,
        address: rawFormData.address,
      };
      // Only allow changing isActive if not editing an ADMIN user
      if (!this.isEditingAdminUser) {
        formData.isActive = rawFormData.isActive;
      }
      // Apenas Admin pode enviar alteração de role
      if (this.isAdmin) {
        formData.role = rawFormData.role;
      }
      if (this.isAdmin) {
        formData.tenantId = rawFormData.tenantId; // já desabilitado mas mantém consistência
      }
      if (rawFormData.password) {
        formData.password = rawFormData.password;
        formData.currentPassword = rawFormData.currentPassword;
      }

      this.usersService.updateUser(this.user.id, formData).subscribe({
        next: () => {
          this.saving = false;
          const successModal = new bootstrap.Modal(
            document.getElementById('successModal')
          );
          successModal.show();
        },
        error: (err) => {
          console.error('Erro ao atualizar usuário:', err);
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
    this.router.navigate(['/users']);
  }

  markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  hasFormChanged(): boolean {
    if (!this.originalFormValues) {
      return false;
    }

    // Include disabled controls for accurate comparison (e.g., isActive when disabled)
    const currentValues = this.userForm.getRawValue();

    // Comparar cada campo
    return Object.keys(this.originalFormValues).some((key) => {
      return this.originalFormValues[key] !== currentValues[key];
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
      if (field.errors['email']) return 'Email deve ter um formato válido';
      if (field.errors['pattern'])
        return `${this.getFieldLabel(fieldName)} tem formato inválido`;
    }
    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      role: 'Função',
      address: 'Endereço',
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
