import { Component, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../enum/roles.enum';
import { User } from '../../../../features/admin/users/interfaces/user.interface';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<void>();
  collapsed = signal<boolean>(false);
  activeSubmenu = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  currentDate = signal(new Date());
  intervalId: any;
  userRole: Role | null = null;
  isAdmin = false;
  filteredMenuItems: any[] = [];

  menuItems = [
    {
      role: [Role.MANAGER_REVIEWERS, Role.CLIENT, Role.ASSISTANT_REVIEWERS],
      menu: 'Ordens',
      route: '/orders',
      icon: 'bi bi-receipt',
      // subRoutes serão filtradas conforme role (assistente não pode criar)
      subRoutes: [
        {
          label: 'Listar Ordens',
          route: '/orders',
          icon: 'bi bi-list-check',
          allowed: [
            Role.MANAGER_REVIEWERS,
            Role.CLIENT,
            Role.ASSISTANT_REVIEWERS,
          ],
        },
        {
          label: 'Nova Ordem',
          route: '/orders/create',
          icon: 'bi bi-plus-circle',
          allowed: [Role.MANAGER_REVIEWERS, Role.CLIENT],
        },
      ],
    },
    {
      role: [Role.MANAGER_REVIEWERS],
      menu: 'Clientes',
      route: '/clients',
      icon: 'bi bi-people',
      subRoutes: [
        { label: 'Listar', route: '/clients', icon: 'bi bi-list' },
        {
          label: 'Novo Cliente',
          route: '/clients/create',
          icon: 'bi bi-plus-circle',
        },
      ],
    },
    {
      role: [Role.MANAGER_REVIEWERS],
      menu: 'Funcionalidades',
      route: '/functionalities',
      icon: 'bi bi-box',
      subRoutes: [
        { label: 'Listar', route: '/functionalities', icon: 'bi bi-list' },
        {
          label: 'Nova Funcionalidade',
          route: '/functionalities/create',
          icon: 'bi bi-plus-circle',
        },
      ],
    },
    {
      role: [Role.ADMIN, Role.MANAGER_REVIEWERS],
      menu: 'Usuários',
      route: '/users',
      icon: 'bi bi-person-fill',
      subRoutes: [
        { label: 'Listar', route: '/users', icon: 'bi bi-list' },
        {
          label: 'Novo Usuário',
          route: '/users/create',
          icon: 'bi bi-person-plus',
        },
      ],
    },
    {
      role: [Role.ADMIN],
      menu: 'Empresas',
      route: '/tenants',
      icon: 'bi bi-building',
      subRoutes: [
        { label: 'Listar', route: '/tenants', icon: 'bi bi-list' },
        {
          label: 'Nova Empresa',
          route: '/tenants/create',
          icon: 'bi bi-plus-circle',
        },
      ],
    },
    {
      role: [Role.ADMIN, Role.MANAGER_REVIEWERS],
      menu: 'Relatórios',
      route: '/reports',
      icon: 'bi bi-bar-chart',
    },
    {
      role: [Role.ADMIN],
      menu: 'Configurações',
      route: '/settings',
      icon: 'bi bi-gear',
    },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.bindCurrentUser();

    this.intervalId = setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private bindCurrentUser() {
    this.authService.userProfile$.subscribe((profile) => {
      if (!profile) return;
      this.userEmail.set(profile.email);
      this.userRole = (profile.role as Role) || null;
      this.isAdmin = !!profile.isAdmin;
      this.filteredMenuItems = this.menuItems
        .filter((item) => this.isAuthorized(item.role))
        .map((item) => {
          if (item.subRoutes) {
            const subFiltered = item.subRoutes.filter(
              (sr: any) =>
                !this.userRole ||
                !sr.allowed ||
                sr.allowed.includes(this.userRole)
            );
            return { ...item, subRoutes: subFiltered };
          }
          return item;
        });
    });
  }

  toggleSidebar() {
    this.collapsed.set(!this.collapsed());
    this.toggle.emit();
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
    if (this.isAdmin) return true;
    return (
      roles.length === 0 ||
      (this.userRole != null && roles.includes(this.userRole))
    );
  }
}
