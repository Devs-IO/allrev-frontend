import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { ResponseUserDto } from '../../types/user.dto';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class UserViewComponent implements OnInit {
  user: ResponseUserDto | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.error = 'ID do usuário não fornecido';
      this.loading = false;
    }
  }

  loadUser(id: string): void {
    this.usersService.getUserById(id).subscribe({
      next: (data: ResponseUserDto) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        this.error = 'Erro ao carregar dados do usuário';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  editUser(): void {
    if (this.user) {
      this.router.navigate(['/users', this.user.id, 'edit']);
    }
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
