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
      this.usersService.getUserById(id).subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar usuário';
          this.loading = false;
        },
      });
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

  back() {
    this.router.navigate(['/users']);
  }
}
