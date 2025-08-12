import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { ResponseUserDto } from '../../types/user.dto';
import { AuthService } from '../../../../app/core/services/auth.service';

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
  isAdmin = false;
  currentTenantIdGerente: string | null = null;
  viewingAsManager = false; // se true, mostra layout reduzido
  functionalities: AssistantFunctionality[] = [];

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.userProfile$.subscribe({
      next: (profile: any) => {
        if (profile) {
          const roleLower = (profile.role || '').toLowerCase();
          this.isAdmin = !!profile.isAdmin || roleLower === 'admin';
          // Se for gerente, usar o tenant.id retornado no profile
          this.currentTenantIdGerente =
            roleLower === 'manager_reviewers'
              ? profile.tenant?.id || null
              : null;
        }
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.loadUser(id);
        } else {
          this.error = 'ID do usuário não fornecido';
          this.loading = false;
        }
      },
      error: () => {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.loadUser(id);
        else {
          this.error = 'ID do usuário não fornecido';
          this.loading = false;
        }
      },
    });
  }

  loadUser(id: string): void {
    this.loading = true;

    console.log(
      'Loading user with ID:',
      id,
      this.isAdmin,
      this.currentTenantIdGerente
    );

    // Se for admin usa rota completa; se gerente usa rota assistants
    const request$ = this.isAdmin
      ? this.usersService.getUserById(id)
      : this.currentTenantIdGerente
      ? this.usersService.getAssistantById(id)
      : this.usersService.getUserById(id);

    request$.subscribe({
      next: (data: any) => {
        if (this.isAdmin) {
          this.user = data;
          this.viewingAsManager = false;
        } else if (this.currentTenantIdGerente) {
          this.viewingAsManager = true;
          this.functionalities = data.functionalities || [];
          this.user = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            isActive: data.isActive,
            createdAt: data.createdAt,
            role: 'assistant_reviewers',
          };
        } else {
          this.user = data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        if (err?.status === 403) {
          this.error = 'Você não tem permissão para visualizar este usuário.';
          setTimeout(() => this.router.navigate(['/users']), 2500);
        } else {
          this.error = 'Erro ao carregar dados do usuário';
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
