import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Features Imports
import { UsersService } from '../../services/users.service';
import { TenantsService } from '../../../tenants/services/tenants.service';
import { CreateUserDto, ResponseUserDto } from '../../types/user.dto';
import { Role, RoleLabels } from '../../interfaces/user.enums'; // Ou use o Role do Core se preferir unificar

// Core Imports
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ErrorHelper } from '../../../../../app/core/helpers/error.helper';
import { Role as CoreRole } from '../../../../../app/core/enum/roles.enum';

// Shared Imports
import { PhoneMaskDirective } from '../../../../../app/shared/directives/phone-mask.directive';

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
  isEditingAdminUser = false; // Flag para saber se estamos editando um Admin

  // Enums para o template
  Role = CoreRole;
  roleOptions: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    // 1. Carregar Roles Disponíveis
    this.loadAvailableRoles();

    // 2. Verificar Permissões do Usuário Logado
    this.checkCurrentUserPermissions();

    // 3. Carregar Usuário a ser editado
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    } else {
      this.error = 'ID do usuário não fornecido.';
      this.loading = false;
    }
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
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: [null, Validators.required], // Role é preenchido dinamicamente
      address: ['', [Validators.required, Validators.minLength(5)]],
      tenantId: [{ value: '', disabled: true }], // Geralmente desabilitado na edição, salvo se for Admin trocando
      isActive: [true],
      photo: [''],
    });
  }

  private checkCurrentUserPermissions() {
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUserRole = user.role;
        this.isAdmin = user.role === CoreRole.ADMIN;

        // Se for admin, habilita a troca de tenant (opcional, dependendo da regra de negócio)
        if (this.isAdmin) {
          this.userForm.get('tenantId')?.enable();
          this.loadTenants();
        } else {
          this.userForm.get('tenantId')?.disable();
        }
      }
    });
  }

  private loadUser(id: string) {
    this.loading = true;
    this.usersService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.isEditingAdminUser = user.role === CoreRole.ADMIN;
        this.populateForm(user);
        this.loading = false;
      },
      error: (err) => {
        this.error = ErrorHelper.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  private populateForm(user: ResponseUserDto) {
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isActive: user.isActive,
      photo: user.photo,
      tenantId: user.tenant?.id || user.tenantId, // Suporta tanto objeto quanto ID
    });

    if (user.tenant) {
      this.tenantName = user.tenant.companyName ?? '';
    }

    // Salva estado inicial para verificação de "dirty"
    this.originalFormValues = this.userForm.getRawValue();
  }

  private loadTenants() {
    this.tenantsService.getTenants().subscribe({
      next: (data) => (this.tenants = data),
      error: (err) => console.error('Erro ao carregar tenants', err),
    });
  }

  loadAvailableRoles() {
    this.usersService.getAvailableRoles().subscribe({
      next: (roles) => {
        this.roleOptions = roles.map((role) => ({
          value: role,
          label: RoleLabels[role as keyof typeof RoleLabels] || role,
        }));
      },
      error: () => {
        this.error = 'Erro ao carregar lista de funções.';
      },
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.userForm.getRawValue();

    // Filtra apenas campos alterados se desejar, ou envia tudo (PUT costuma ser tudo)
    // Aqui enviamos o objeto completo ajustado para o DTO
    const updateUserDto: Partial<CreateUserDto> = {
      ...formValue,
      // Garante que tenantId vá correto se for admin editando
      tenantId: this.isAdmin ? formValue.tenantId : this.user?.tenantId,
    };

    if (this.user?.id) {
      this.usersService.updateUser(this.user.id, updateUserDto).subscribe({
        next: () => {
          this.saving = false;
          // Feedback visual via Toast seria ideal aqui
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.saving = false;
          this.error = ErrorHelper.getErrorMessage(err);
        },
      });
    }
  }

  hasChanges(): boolean {
    if (!this.originalFormValues) return false;
    const currentValues = this.userForm.getRawValue();
    return (
      JSON.stringify(this.originalFormValues) !== JSON.stringify(currentValues)
    );
  }

  // Alias para o template
  hasFormChanged(): boolean {
    return this.hasChanges();
  }

  // --- Helpers UI ---

  getFieldError(fieldName: string): string | null {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      const label = this.getFieldLabel(fieldName);
      if (field.errors['required']) return `${label} é obrigatório`;
      if (field.errors['minlength']) return `${label} muito curto`;
      if (field.errors['email']) return 'E-mail inválido';
      // ... outros erros
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
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
}
