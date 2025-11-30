import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// Services & Core
import { AuthService } from '../../../../../app/core/services/auth.service';
import { Role } from '../../../../../app/core/enum/roles.enum';
import { UserProfile } from '../../../users/interfaces/user-profile.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: UserProfile | null = null;
  private currentUserId: string | null = null;

  // Signals/Computed properties para template limpo
  readonly isAdmin = computed(() => this.user?.role === Role.ADMIN);
  readonly isManager = computed(
    () => this.user?.role === Role.MANAGER_REVIEWERS
  );
  readonly isAssistant = computed(
    () => this.user?.role === Role.ASSISTANT_REVIEWERS
  );

  ngOnInit() {
    // 1. Carrega dados detalhados do perfil (Role, Tenants, Address)
    this.authService.userProfile$.subscribe((userData) => {
      if (userData) {
        this.user = { ...userData } as UserProfile;
      }
    });

    // 2. Garante que temos o ID do usuário atual para operações seguras
    // CORREÇÃO: Usando a propriedade currentUser$ em vez de método
    this.authService.currentUser$.subscribe((u) => {
      this.currentUserId = u?.id ?? null;

      // Se o perfil detalhado ainda não estiver carregado, força o carregamento
      if (!this.user && u) {
        this.authService.loadUserProfile().subscribe();
      }
    });
  }

  editProfile() {
    // Futuro: Implementar modal ou navegação para edição
    alert(
      'Funcionalidade de edição de perfil será implementada na próxima Sprint.'
    );
  }

  /**
   * Retorna os nomes das empresas vinculadas formatados
   */
  assistantTenantNames(): string {
    // Verifica se existe o objeto tenant principal
    if (this.user?.tenant?.companyName) {
      return this.user.tenant.companyName;
    }

    // Verifica se existe lista de tenants (para casos multi-tenant futuros)
    if (
      this.user?.tenants &&
      Array.isArray(this.user.tenants) &&
      this.user.tenants.length > 0
    ) {
      // Se o tenant for um objeto complexo, mapeia o nome. Se for string, usa direto.
      return this.user.tenants
        .map(
          (t: any) =>
            t.companyName || t.tenant?.companyName || 'Empresa sem nome'
        )
        .join(', ');
    }

    return 'Nenhuma empresa vinculada';
  }

  roleLabel(role?: string): string {
    switch (role) {
      case Role.ADMIN:
        return 'Administrador do Sistema';
      case Role.MANAGER_REVIEWERS:
        const company = this.user?.tenant?.companyName
          ? ` - ${this.user.tenant.companyName}`
          : '';
        return `Gestor${company}`;
      case Role.ASSISTANT_REVIEWERS:
        return 'Assistente de Revisão';
      case Role.CLIENT:
        return 'Cliente';
      default:
        return 'Usuário';
    }
  }

  calculateDaysToDue(dueDate: string | Date): number {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    // Diferença em dias arredondada para cima
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  // Indica se o perfil exibido é do próprio usuário logado
  get isOwnProfile(): boolean {
    return !!this.user?.id && this.user.id === this.currentUserId;
  }
}
