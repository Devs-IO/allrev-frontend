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
import { Role } from '../../interfaces/user.enums';
import { AuthService } from '../../../../app/core/services/auth.service';

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
  user: ResponseUserDto | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  isAdmin = false;
  tenantName = '';

  // Role options
  roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuário' },
    { value: 'manager_reviewers', label: 'Gestor de Revisores' },
    { value: 'client', label: 'Cliente' },
    { value: 'assistant_reviewers', label: 'Assistente de Revisores' },
    { value: 'none', label: 'Nenhum' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Verificar se é admin
    this.authService.getUser().subscribe({
      next: (user: any) => {
        this.isAdmin = user.role === 'admin';
        this.filterRoleOptions();
      },
      error: () => {
        this.isAdmin = false;
        this.filterRoleOptions();
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
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['', [Validators.required]],
      address: ['', [Validators.required]],
      isActive: [true],
    });
  }

  filterRoleOptions(): void {
    if (!this.isAdmin) {
      // Se não for admin, remover opções administrativas
      this.roleOptions = this.roleOptions.filter(
        (option) =>
          !['admin', 'user', 'manager_reviewers'].includes(option.value)
      );
    }
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
        this.error = 'Erro ao carregar dados do usuário';
        this.loading = false;
      },
    });
  }

  populateForm(user: ResponseUserDto): void {
    // Configurar nome da empresa
    if ((user as any).tenant && (user as any).tenant.companyName) {
      this.tenantName = (user as any).tenant.companyName;
    } else if ((user as any).tenantCompanyName) {
      this.tenantName = (user as any).tenantCompanyName;
    } else {
      this.tenantName = user.tenantId || 'Não informado';
    }

    // Preencher formulário
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isActive: user.isActive,
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && this.user) {
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

      const formData: Partial<CreateUserDto> = {
        ...this.userForm.value,
      };

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
          this.error = 'Erro ao atualizar usuário. Tente novamente.';
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
