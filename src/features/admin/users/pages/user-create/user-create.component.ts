import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';

// Serviços de Features (ajuste de caminho relativo)
import { TenantsService } from '../../../tenants/services/tenants.service';
import { UsersService } from '../../services/users.service';

// Tipos e Interfaces
import { CreateUserDto } from '../../types/user.dto';
import { Role, RoleLabels } from '../../interfaces/user.enums';

// Core Services & Helpers
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ErrorHelper } from '../../../../../app/core/helpers/error.helper';

// Shared Directives (Movido de Core para Shared)
import { PhoneMaskDirective } from '../../../../../app/shared/directives/phone-mask.directive';

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

  // Tipagem melhorada (se possível, use interface Tenant, senão any está ok pro MVP)
  tenants: any[] = [];

  isAdmin = false;
  tenantName = '';
  currentUserRole = '';

  // Enums para o template
  Role = Role;

  // Labels para exibição no Select
  roleOptions: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    private tenantsService: TenantsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
    // Carrega roles e verifica permissões em paralelo
    this.loadAvailableRoles();
    this.checkAdminAndTenant();
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
      // Role inicia vazia, será preenchida ao carregar as opções
      role: [null, Validators.required],
      address: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200),
        ],
      ],
      tenantId: [''], // Validação será dinâmica
      isActive: [true],
      photo: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  private checkAdminAndTenant() {
    this.authService.currentUser$.pipe(take(1)).subscribe({
      next: (user: any) => {
        if (!user) {
          console.warn('⚠️ Usuário não carregado ainda');
          // Tenta pegar do localStorage como fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            console.log('📦 Tentando carregar do localStorage...');
            const parsedUser = JSON.parse(storedUser);
            this.processUserData(parsedUser);
          } else {
            this.error = 'Usuário não autenticado. Faça login novamente.';
          }
          return;
        }

        console.log('👤 Usuário carregado:', user);
        this.processUserData(user);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar dados do usuário:', err);
        this.error = ErrorHelper.getErrorMessage(err);
      },
    });
  }

  private processUserData(user: any) {
    this.currentUserRole = user.role;
    this.isAdmin = user.role === Role.ADMIN;
    const tenantIdControl = this.userForm?.get('tenantId');

    if (this.isAdmin) {
      console.log('🔑 Usuário é ADMIN, carregando lista de empresas...');
      tenantIdControl?.setValidators([Validators.required]);
      tenantIdControl?.enable();
      this.loadTenants();
    } else {
      console.log('👔 Usuário é GESTOR/ASSISTENTE, tentando obter empresa...');
      // Para GESTOR: tenant vem como objeto completo { id, companyName, ... }
      // Para ASSISTENTE: tenants vem como array [{ tenantId, role }]

      let tenantId: string | null = null;
      let tenantName: string | null = null;

      // Prioridade 1: tenant (para gestores - vem do UserTenant com role MANAGER)
      if (user.tenant?.id) {
        tenantId = user.tenant.id;
        tenantName = user.tenant.companyName;
        console.log('🏢 Empresa obtida de user.tenant (GESTOR):', tenantName);
      }
      // Prioridade 2: buscar no array tenants o vínculo como MANAGER
      else if (user.tenants && user.tenants.length > 0) {
        // Procura primeiro o vínculo como manager_reviewers
        const managerTenant = user.tenants.find(
          (t: any) => t.role === Role.MANAGER_REVIEWERS
        );

        if (managerTenant) {
          tenantId = managerTenant.tenantId;
          console.log('🏢 TenantId obtido como GESTOR:', tenantId);
          // Carrega o nome da empresa via API já que não vem no objeto
          if (tenantId) this.loadTenantName(tenantId);
        } else {
          // Se não for gestor, pega o primeiro vínculo (assistente)
          tenantId = user.tenants[0].tenantId;
          console.log('🏢 TenantId obtido como ASSISTENTE:', tenantId);
          if (tenantId) this.loadTenantName(tenantId);
        }
      }

      console.log('🆔 TenantId final:', tenantId);

      if (tenantId) {
        tenantIdControl?.setValue(tenantId);
        tenantIdControl?.disable();
        console.log('✅ Empresa configurada (ID:', tenantId, ')');
      } else {
        console.error('❌ TenantId não encontrado no usuário');
        console.error(
          '📋 Estrutura do usuário:',
          JSON.stringify(user, null, 2)
        );
        this.error =
          'Erro: Empresa do usuário não identificada. Entre em contato com o administrador.';
      }
    }
    tenantIdControl?.updateValueAndValidity();
  }

  private loadTenantName(tenantId: string) {
    this.tenantsService.getTenant(tenantId).subscribe({
      next: (tenant: any) => {
        this.tenantName = tenant.companyName;
        console.log('✅ Nome da empresa carregado:', this.tenantName);
      },
      error: (err) => {
        console.error('⚠️ Erro ao carregar nome da empresa:', err);
        this.tenantName = 'Sua Empresa';
      },
    });
  }

  private loadTenants() {
    console.log('Carregando empresas...');
    this.tenantsService.getTenants().subscribe({
      next: (tenants: any[]) => {
        console.log('Empresas carregadas:', tenants);
        this.tenants = tenants;

        // UX: Se for Admin e só tiver 1 tenant, seleciona automático
        if (this.isAdmin && tenants.length === 1) {
          const t = tenants[0];
          this.userForm.get('tenantId')?.setValue(t.id);
          this.tenantName = t.companyName;
          console.log('Auto-selecionado empresa única:', t.companyName);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
        this.error = ErrorHelper.getErrorMessage(err);
        this.tenants = [];
      },
    });
  }

  loadAvailableRoles() {
    // Busca roles permitidas para quem está logado (ex: Gestor não vê role Admin)
    this.usersService.getAvailableRoles().subscribe({
      next: (roles: Role[]) => {
        this.roleOptions = roles.map((role) => ({
          value: role,
          label: RoleLabels[role] || role,
        }));

        // Define valor padrão inteligente
        const roleCtrl = this.userForm.get('role');
        const hasManager = roles.includes(Role.MANAGER_REVIEWERS);
        const hasAssistant = roles.includes(Role.ASSISTANT_REVIEWERS);

        // Se for gestor criando, sugere Assistente. Se for Admin, sugere Gestor.
        if (roleCtrl && !roleCtrl.value) {
          if (hasAssistant) roleCtrl.setValue(Role.ASSISTANT_REVIEWERS);
          else if (hasManager) roleCtrl.setValue(Role.MANAGER_REVIEWERS);
          else if (roles.length > 0) roleCtrl.setValue(roles[0]);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar roles:', err);
        this.error = 'Não foi possível carregar as funções disponíveis.';
      },
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = false;

    // Prepara o Payload
    const formValue = this.userForm.getRawValue(); // Pega inclusive campos disabled (tenantId)

    // Remove campos desnecessários ou sensíveis que não existem mais no form
    const { password, confirmPassword, ...payload } = formValue;

    const createUserDto: CreateUserDto = payload as CreateUserDto;

    this.usersService.createUser(createUserDto).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        // UX: Feedback visual e redirecionamento
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.error = ErrorHelper.getErrorMessage(err);
      },
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // --- Helpers de UI ---

  getFieldError(fieldName: string): string | null {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      const label = this.getFieldLabel(fieldName);

      if (field.errors['required']) return `${label} é obrigatório`;
      if (field.errors['minlength']) return `${label} muito curto`;
      if (field.errors['maxlength']) return `${label} muito longo`;
      if (field.errors['email']) return `E-mail inválido`;
      if (field.errors['pattern']) return `Formato inválido`;
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      role: 'Função',
      address: 'Endereço',
      tenantId: 'Empresa',
    };
    return labels[fieldName] || fieldName;
  }

  openTenantForm() {
    this.router.navigate(['/tenants/create']);
  }
}
