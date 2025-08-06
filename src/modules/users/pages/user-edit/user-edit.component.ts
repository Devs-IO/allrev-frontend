import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto, ResponseUserDto } from '../../types/user.dto';
import { Role, RoleLabels } from '../../interfaces/user.enums';
import { AuthService } from '../../../../app/core/services/auth.service';
import { ErrorHelper } from '../../../../app/core/helpers/error.helper';
import { TenantsService } from '../../../tenants/services/tenants.service';

declare var bootstrap: any;

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    // Sempre priorize o tenant do objeto user.tenant
    if (user.tenant && user.tenant.companyName) {
      this.tenantName = user.tenant.companyName;
      this.userForm.get('tenantId')?.setValue(user.tenant.id);
    } else if ((user as any).tenantCompanyName) {
      this.tenantName = (user as any).tenantCompanyName;
      this.userForm.get('tenantId')?.setValue(user.tenantId);
    } else {
      this.tenantName = user.tenantId || 'Não informado';
      this.userForm.get('tenantId')?.setValue(user.tenantId);
    }

    // Preencher formulário
    const formValues = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      tenantId: this.userForm.get('tenantId')?.value,
      isActive: user.isActive,
      currentPassword: '',
      password: '',
      confirmPassword: '',
    };

    this.userForm.patchValue(formValues);

    // Desabilitar email sempre (não deve ser editável)
    this.userForm.get('email')?.disable();

    // Configurar tenantId baseado no tipo de usuário
    const tenantIdControl = this.userForm.get('tenantId');
    tenantIdControl?.clearValidators();
    tenantIdControl?.disable();
    tenantIdControl?.updateValueAndValidity();

    // Salvar valores originais para comparação
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

      // Fechar modal de confirmação
      const confirmModal = bootstrap.Modal.getInstance(
        document.getElementById('confirmEditModal')
      );
      confirmModal.hide();

      // Preparar dados para envio (incluindo valores desabilitados)
      const rawFormData = this.userForm.getRawValue();
      const formData: Partial<CreateUserDto> = {
        name: rawFormData.name,
        phone: rawFormData.phone,
        role: rawFormData.role,
        address: rawFormData.address,
        isActive: rawFormData.isActive,
        tenantId: rawFormData.tenantId,
      };

      // Adicionar senha apenas se foi informada
      if (rawFormData.password) {
        formData.password = rawFormData.password;
        formData.currentPassword = rawFormData.currentPassword;
      }

      this.usersService.updateUser(this.user.id, formData).subscribe({
        next: () => {
          this.saving = false;
          // Mostrar modal de sucesso
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

    const currentValues = this.userForm.value;

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
