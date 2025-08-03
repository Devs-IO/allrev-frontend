import { Component, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto, ResponseUserDto } from '../../types/user.dto';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class UsersComponent {
  users: WritableSignal<ResponseUserDto[]> = signal<ResponseUserDto[]>([]);
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Estado para formulário/modal
  showForm = false;
  isEditMode = false;
  selectedUser: ResponseUserDto | null = null;
  formData: Partial<CreateUserDto> = {};
  showDetails = false;
  loggedUserId: string = '';

  constructor(
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        this.loggedUserId = user.id || '';
        this.loadUsers();
      },
      error: () => {
        this.loggedUserId = '';
        this.loadUsers();
      },
    });
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (data: ResponseUserDto[]) => this.users.set(data),
      error: (err) => console.error('Erro ao carregar usuários:', err),
    });
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    const sorted = [...this.users()].sort((a, b) => {
      const key = column as keyof ResponseUserDto;
      let aValue = a[key];
      let bValue = b[key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    this.users.set(sorted);
  }

  // CRUD
  openCreateForm() {
    this.isEditMode = false;
    this.formData = {};
    this.showForm = true;
  }

  openEditForm(user: ResponseUserDto) {
    this.isEditMode = true;
    this.formData = {
      ...user,
      role: user.role as any, // Converte string para Role enum
    };
    this.selectedUser = user;
    this.showForm = true;
  }

  submitForm() {
    if (this.isEditMode && this.selectedUser) {
      this.usersService
        .updateUser(
          this.selectedUser.id,
          this.formData as Partial<CreateUserDto>
        )
        .subscribe({
          next: () => {
            this.loadUsers();
            this.cancelForm();
          },
          error: (err) => alert('Erro ao atualizar usuário: ' + err),
        });
    } else {
      this.usersService.createUser(this.formData as CreateUserDto).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelForm();
        },
        error: (err) => alert('Erro ao criar usuário: ' + err),
      });
    }
  }

  editUser(id: string) {
    this.router.navigate(['/users', id, 'edit']);
  }

  cancelForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedUser = null;
    this.formData = {};
  }

  deleteUser(id: string) {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert('Erro ao deletar usuário: ' + err),
      });
    }
  }

  viewUser(id: string) {
    this.router.navigate(['/users', id]);
  }

  closeDetails() {
    this.showDetails = false;
    this.selectedUser = null;
  }
}
