import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { ResponseUserDto } from '../../types/user.dto';
import { AuthService } from '../../../../app/core/services/auth.service';
import { ConfirmationModalComponent } from '../../../../app/core/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
})
export class UsersListComponent implements OnInit {
  users: WritableSignal<ResponseUserDto[]> = signal<ResponseUserDto[]>([]);
  loading = true;
  error: string | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  loggedUserId: string = '';
  isAdmin: boolean = false;

  // Estado para modais de confirmação
  showEditModal = false;
  showDeleteModal = false;
  selectedUser: ResponseUserDto | null = null;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getUserProfile().subscribe({
      next: (user: any) => {
        this.loggedUserId = user.id || '';
        this.isAdmin = user.role === 'admin' || user.role === 'ADMIN';
        this.loadUsers();
      },
      error: () => {
        this.loggedUserId = '';
        this.isAdmin = false;
        this.loadUsers();
      },
    });
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (data: ResponseUserDto[]) => {
        this.users.set(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.error = 'Erro ao carregar usuários';
        this.loading = false;
      },
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

  viewUser(id: string): void {
    this.router.navigate(['/users', id]);
  }

  editUser(id: string): void {
    this.selectedUser = this.users().find((u) => u.id === id) || null;
    this.showEditModal = true;
  }

  confirmEdit(): void {
    if (this.selectedUser) {
      this.showEditModal = false;
      this.router.navigate(['/users', this.selectedUser.id, 'edit']);
    }
  }

  deleteUser(id: string): void {
    this.selectedUser = this.users().find((u) => u.id === id) || null;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.selectedUser) {
      this.usersService.deleteUser(this.selectedUser.id).subscribe({
        next: () => {
          this.loadUsers();
          this.showDeleteModal = false;
          this.selectedUser = null;
          alert('Usuário deletado com sucesso!');
        },
        error: (err) => {
          console.error('Erro ao deletar usuário:', err);
          alert('Erro ao deletar usuário. Tente novamente.');
        },
      });
    }
  }

  closeModals(): void {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  translateRole(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'user':
        return 'Usuário';
      case 'manager_reviewers':
        return 'Gestor de Revisores';
      case 'client':
        return 'Cliente';
      case 'assistant_reviewers':
        return 'Assistente de Revisores';
      case 'none':
        return 'Nenhum';
      default:
        return 'Desconhecido';
    }
  }
}
