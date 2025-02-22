import { Component, signal, WritableSignal } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { UserProfile } from '../../../../core/interfaces/user-profile.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  standalone: true,
  imports: [CommonModule]
})
export class UsersComponent {
  users: WritableSignal<UserProfile[]> = signal<UserProfile[]>([]);
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (data: UserProfile[]) => this.users.set(data),
      error: (err) => console.error('Erro ao carregar usuários:', err)
    });
  }

  // Função para ordenar a tabela
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Inverte a direção se a mesma coluna for clicada novamente
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const sorted = [...this.users()].sort((a, b) => {
      let aValue = a[column as keyof UserProfile];
      let bValue = b[column as keyof UserProfile];

      // Se for data, converte para timestamp
      if (aValue instanceof Date && bValue instanceof Date) {
        const aTimestamp = (aValue as Date).getTime();
        const bTimestamp = (bValue as Date).getTime();
      }
      // Se for string, compara em letras minúsculas
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    this.users.set(sorted);
  }

  deleteUser(id: string) {
    console.log('Delete cliente:', id);
  }

  viewUser(id: string) {
    console.log('Visualizar cliente:', id);
  }

  editUser(id: string) {
    console.log('Editar cliente:', id);
  }
}
