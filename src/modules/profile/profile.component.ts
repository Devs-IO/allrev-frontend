import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, computed } from '@angular/core';
import { AuthService } from '../../app/core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { UserProfile } from '../users/interfaces/user-profile.interface';
import { Role } from '../../app/core/enum/roles.enum';

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

  readonly isAdmin = computed(() => this.user?.isAdmin || false);
  readonly isManager = computed(
    () => this.user?.role === Role.MANAGER_REVIEWERS
  );
  readonly isAssistant = computed(
    () => this.user?.role === Role.ASSISTANT_REVIEWERS
  );

  ngOnInit() {
    this.authService.userProfile$.subscribe((userData) => {
      if (userData) this.user = { ...userData } as UserProfile;
    });

    // track logged-in user id for conditional actions (own profile only)
    this.authService.getCurrentUser$().subscribe((u) => {
      this.currentUserId = u?.id ?? null;
    });
  }

  editProfile() {
    alert('Função de edição ainda não implementada.');
  }

  assistantTenantNames(): string {
    if (!this.user?.tenants?.length) return 'Nenhuma';
    return this.user.tenants.map((t) => t.companyName).join(', ');
  }

  roleLabel(role?: string): string {
    switch (role) {
      case Role.ADMIN:
        return 'Administrador AllRev';
      case Role.MANAGER_REVIEWERS:
        return this.user?.tenant?.companyName
          ? `Gestor - ${this.user.tenant.companyName}`
          : 'Gestor';
      case Role.ASSISTANT_REVIEWERS:
        return 'Assistente';
      case Role.CLIENT:
        return 'Cliente';
      case Role.USER:
      default:
        return 'Indefinido';
    }
  }

  calculateDaysToDue(dueDate: string | Date): number {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  // Only allow change password for own profile
  get isOwnProfile(): boolean {
    return (
      !!this.user?.id &&
      !!this.currentUserId &&
      this.user.id === this.currentUserId
    );
  }
}
