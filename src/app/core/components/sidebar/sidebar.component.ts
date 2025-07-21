import { Component, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../interfaces/user-profile.interface';
import { Role } from '../../enum/roles.enum';
import { RoleGuard } from '../../guard/role.guard';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<void>(); // Emite evento ao alternar
  collapsed = signal<boolean>(false);
  activeSubmenu = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  currentDate = signal(new Date());
  intervalId: any;
  userRole: Role | null = null;
  filteredMenuItems: any[] = [];

  menuItems = [
    { role: [Role.MANAGER_REVIEWERS], menu: 'Clientes', route: '/customers', icon: 'bi bi-people', subRoutes: [
      { label: 'Novo', route: '/customers/create', icon: 'bi bi-plus-circle' },
      { label: 'Listar', route: '/customers', icon: 'bi bi-list' }
    ] },
    { role: [Role.ADMIN, Role.MANAGER_REVIEWERS], menu: 'Usuários', route: '/users', icon: 'bi bi-person-fill', subRoutes: [
      { label: 'Novo Usuário', route: '/users/create', icon: 'bi bi-person-plus' },
      { label: 'Listar', route: '/users', icon: 'bi bi-list' }
    ] },
    { role: [Role.ADMIN], menu: 'Empresas', route: '/tenants', icon: 'bi bi-building', subRoutes: [
      { label: 'Nova Empresa', route: '/tenants/create', icon: 'bi bi-plus-circle' },
      { label: 'Listar', route: '/tenants', icon: 'bi bi-list' }
    ] },
    { role: [Role.ADMIN], menu: 'Produtos', route: '/products', icon: 'bi bi-box' },
    { role: [Role.ADMIN, Role.MANAGER_REVIEWERS], menu: 'Relatórios', route: '/reports', icon: 'bi bi-bar-chart' },
    { role: [Role.ADMIN], menu: 'Configurações', route: '/settings', icon: 'bi bi-gear' }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.loadUserProfile();
    this.loadUserRoles();

    this.intervalId = setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  loadUserProfile() {
    this.authService.getUserProfile().subscribe({
      next: (user: UserProfile) => {
        this.userEmail.set(user.email);
      },
      error: (err) => {
        console.error('Erro ao buscar perfil do usuário:', err);
      }
    });
  }

  loadUserRoles() {
    this.authService.getUser().subscribe({
      next: (user: User) => {
        this.userRole = user.role;
        this.filteredMenuItems = this.menuItems.filter(item => this.isAuthorized(item.role));
      },
      error: (err) => {
        console.error('Erro ao buscar roles do usuário:', err);
      }
    });
  }

  toggleSidebar() {
    this.collapsed.set(!this.collapsed());
    this.toggle.emit(); // Dispara evento para atualizar layout
  }

  toggleSubmenu(menu: string) {
    this.activeSubmenu.set(this.activeSubmenu() === menu ? null : menu);
  }

  isCollapsed(): boolean {
    return this.collapsed();
  }

  isOpen(menu: string): boolean {
    return this.activeSubmenu() === menu;
  }

  isAuthorized(roles: Role[]): boolean {
    let isAuthorized = false;
    if (roles.length === 0) {
      isAuthorized = true;
    } else if (this.userRole && roles.includes(this.userRole)) {
      isAuthorized = true;
    }
    return isAuthorized;
  }
}
