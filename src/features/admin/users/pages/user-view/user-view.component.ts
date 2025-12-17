import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Services
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../../../../app/core/services/auth.service';

// Tipos e Enums
import { Role } from '../../../../../app/core/enum/roles.enum';

// Interface para as tarefas (Visão do Gestor)
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

// Interface para os vínculos (Visão do Admin)
interface TenantLink {
  tenantId: string;
  companyName: string;
  role: string;
  linkedAt: string;
}

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class UserViewComponent implements OnInit {
  user: any | null = null;
  loading = true;
  error: string | null = null;

  // Controle de Permissão e Visualização
  isAdmin = false;
  isManager = false; // Padronizado com o HTML

  // Dados Específicos por Perfil
  functionalities: AssistantFunctionality[] = []; // Para Gestor ver tarefas
  userTenants: TenantLink[] = []; // Para Admin ver vínculos
  relatedUsers: any[] = []; // Para Admin ver usuários relacionados (assistentes/gestores)

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Identifica o papel do usuário logado para ajustar a UI
    this.authService.currentUser$.subscribe((currentUser) => {
      if (currentUser) {
        this.isAdmin = currentUser.role === Role.ADMIN;
        // Verifica se é Gestor (usado no *ngIf do HTML)
        this.isManager = currentUser.role === Role.MANAGER_REVIEWERS;
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
    this.loading = true;
    this.usersService.getUserById(id).subscribe({
      next: (data: any) => {
        this.user = data;

        // LÓGICA DE DADOS POR PERFIL

        // Se for ADMIN, o backend (findById) retorna 'tenants' e 'relatedUsers'
        if (this.isAdmin && Array.isArray(data.tenants)) {
          this.userTenants = data.tenants;
        }

        // Se admin está vendo um user, carregar usuários relacionados
        if (this.isAdmin && Array.isArray(data.relatedUsers)) {
          this.relatedUsers = data.relatedUsers;
        }

        // Se for GESTOR, o backend retorna 'functionalities' (tarefas do assistente)
        // ou você pode extrair do payload se vier aninhado diferente
        if (this.isManager && Array.isArray(data.functionalities)) {
          this.functionalities = data.functionalities;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        if (err.status === 403) {
          this.error =
            'Você não tem permissão para visualizar os detalhes deste usuário.';
          setTimeout(() => this.goBack(), 3000);
        } else if (err.status === 404) {
          this.error = 'Usuário não encontrado.';
        } else {
          this.error = 'Erro interno ao carregar dados do usuário.';
        }
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  editUser(): void {
    // Apenas Admin pode editar dados globais (Nome, Email)
    if (this.isAdmin && this.user) {
      this.router.navigate(['/users', this.user.id, 'edit']);
    }
  }

  translateRole(role: string): string {
    switch (role) {
      case Role.ADMIN:
      case 'ADMIN':
        return 'Administrador';
      case Role.MANAGER_REVIEWERS:
      case 'MANAGER_REVIEWERS':
        return 'Gestor';
      case Role.CLIENT:
      case 'CLIENT':
        return 'Cliente';
      case Role.ASSISTANT_REVIEWERS:
      case 'ASSISTANT_REVIEWERS':
        return 'Assistente';
      default:
        return role || 'Nenhum';
    }
  }
}
