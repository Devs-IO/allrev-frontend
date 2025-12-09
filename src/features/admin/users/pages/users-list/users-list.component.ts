import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { ResponseUserDto } from '../../types/user.dto';
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ConfirmationModalComponent } from '../../../../../app/shared/components/confirmation-modal/confirmation-modal.component';
import { SpinnerComponent } from '../../../../../app/shared/components/spinner/spinner.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmationModalComponent,
    SpinnerComponent,
  ],
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

  // Textos dinâmicos para o modal (Diferença Admin vs Gestor)
  deleteModalTitle = '';
  deleteModalMessage = '';

  constructor(
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.userProfile$.subscribe({
      next: (user: any) => {
        if (user) {
          this.loggedUserId = user.id || '';
          this.isAdmin =
            !!user.isAdmin || user.role === 'admin' || user.role === 'ADMIN';
        } else {
          this.loggedUserId = '';
          this.isAdmin = false;
        }
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
        // Se não for admin, garantir que não apareça um gerente (apenas assistentes)
        // removendo qualquer item cujo role contenha 'manager'
        const filtered = this.isAdmin
          ? data
          : data.filter(
              (u) => String(u.role).toLowerCase() !== 'manager_reviewers'
            );
        this.users.set(filtered);
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

    // Configura a mensagem correta baseada no perfil
    if (this.isAdmin) {
      this.deleteModalTitle = 'Desativar Usuário';
      this.deleteModalMessage = `Tem certeza que deseja desativar o usuário <strong>${this.selectedUser?.name}</strong> do sistema? Ele perderá acesso globalmente.`;
    } else {
      this.deleteModalTitle = 'Remover Assistente';
      this.deleteModalMessage = `Tem certeza que deseja remover <strong>${this.selectedUser?.name}</strong> da sua equipe? O cadastro dele continuará existindo, mas sem acesso aos dados da sua empresa.`;
    }

    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.selectedUser) {
      // O Service já decide qual rota chamar (Global ou Contextual) baseado no currentUser
      this.usersService.deleteUser(this.selectedUser.id).subscribe({
        next: () => {
          this.loadUsers();
          this.showDeleteModal = false;

          // Feedback customizado
          const msg = this.isAdmin
            ? 'Usuário desativado com sucesso!'
            : 'Assistente removido da equipe com sucesso!';

          alert(msg);
          this.selectedUser = null;
        },
        error: (err) => {
          console.error('Erro ao deletar usuário:', err);
          const errMsg = this.isAdmin
            ? 'Erro ao desativar usuário. Tente novamente.'
            : 'Erro ao remover assistente. Tente novamente.';
          alert(errMsg);
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
      case 'ADMIN':
        return 'Administrador';
      case 'user':
        return 'Usuário';
      case 'manager_reviewers':
      case 'MANAGER_REVIEWERS':
        return 'Gestor de Revisores';
      case 'client':
      case 'CLIENT':
        return 'Cliente';
      case 'assistant_reviewers':
      case 'ASSISTANT_REVIEWERS':
        return 'Assistente de Revisores';
      case 'none':
        return 'Nenhum';
      default:
        return role; // Retorna original se não achar
    }
  }
}
