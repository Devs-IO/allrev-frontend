import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../../../../app/core/services/auth.service';

// Tipos
import { Role } from '../../../../../app/core/enum/roles.enum';

interface AssistantFunctionality {
  assignmentId: string;
  orderNumber?: string;
  functionalityId: string;
  functionalityName: string;
  functionalityDescription?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  delivered?: boolean;
  description?: string;
}

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class UserViewComponent implements OnInit {
  user: any | null = null;
  loading = true;
  error: string | null = null;

  // Controle de Permissão
  isAdmin = false;
  viewingAsManager = false;
  functionalities: AssistantFunctionality[] = [];

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Verifica quem está logado para definir permissões de visualização
    this.authService.currentUser$.subscribe((currentUser) => {
      if (currentUser) {
        this.isAdmin = currentUser.role === Role.ADMIN;
      }
    });

    // 2. Carrega o usuário da URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.error = 'ID do usuário não especificado';
      this.loading = false;
    }
  }

  private loadUser(id: string): void {
    this.usersService.getUserById(id).subscribe({
      next: (data: any) => {
        // Se for um assistente sendo visto por um gestor/admin, a API pode retornar funcionalidades
        if (data.functionalities && Array.isArray(data.functionalities)) {
          this.viewingAsManager = true;
          this.functionalities = data.functionalities;
        }

        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        if (err.status === 403) {
          this.error = 'Você não tem permissão para visualizar este usuário.';
          setTimeout(() => this.router.navigate(['/users']), 2500);
        } else {
          this.error = 'Erro ao carregar dados do usuário.';
        }
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
      case Role.ADMIN:
        return 'Administrador';
      case Role.MANAGER_REVIEWERS:
        return 'Gestor';
      case Role.CLIENT:
        return 'Cliente';
      case Role.ASSISTANT_REVIEWERS:
        return 'Assistente';
      default:
        return role;
    }
  }
}
