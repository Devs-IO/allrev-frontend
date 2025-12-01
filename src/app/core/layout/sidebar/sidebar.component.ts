import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../enum/roles.enum';
import { Subscription } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  separator?: boolean;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isCollapsed = false;
  @Output() toggle = new EventEmitter<void>();

  currentUser: any;
  filteredMenu: MenuItem[] = [];
  private userSub!: Subscription;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi bi-grid-1x2-fill',
      route: '/home',
      exact: true,
      roles: [
        Role.MANAGER_REVIEWERS,
        Role.ADMIN,
        Role.ASSISTANT_REVIEWERS,
        Role.USER,
      ],
    },
    {
      label: 'Nova Ordem',
      icon: 'bi bi-plus-circle-dotted',
      route: '/orders/create',
      separator: true,
      exact: true,
      roles: [Role.MANAGER_REVIEWERS, Role.ADMIN],
    },
    {
      label: 'Minhas Tarefas', // Visão Assistente
      icon: 'bi bi-list-check',
      route: '/orders',
      exact: true,
      roles: [Role.ASSISTANT_REVIEWERS],
    },
    {
      label: 'Gestão de Vendas', // Visão Gestor
      icon: 'bi bi-receipt',
      route: '/orders',
      roles: [Role.MANAGER_REVIEWERS, Role.ADMIN],
    },
    {
      label: 'Relatórios',
      icon: 'bi bi-bar-chart-fill',
      route: '/reports',
      roles: [Role.MANAGER_REVIEWERS, Role.ADMIN],
    },
    {
      label: 'Clientes',
      icon: 'bi bi-people-fill',
      route: '/clients',
      roles: [Role.MANAGER_REVIEWERS, Role.ADMIN],
    },
    {
      label: 'Serviços',
      icon: 'bi bi-tools',
      route: '/functionalities',
      separator: true,
      roles: [Role.MANAGER_REVIEWERS, Role.ADMIN],
    },
    {
      label: 'Usuários',
      icon: 'bi bi-person-badge',
      route: '/users',
      roles: [Role.ADMIN, Role.MANAGER_REVIEWERS],
    },
    {
      label: 'Configurações',
      icon: 'bi bi-gear',
      route: '/settings',
      separator: true,
      roles: [Role.ADMIN, Role.MANAGER_REVIEWERS],
    },
  ];

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (this.currentUser) {
        this.filteredMenu = this.menuItems.filter((item) => this.canShow(item));
      } else {
        this.filteredMenu = [];
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }

  private canShow(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    if (!this.currentUser) return false;

    // Regra Estrita: Respeita APENAS o papel ativo no momento.
    // Se estou logado como 'manager_reviewers', vejo coisas de manager.
    // Se mudar para um tenant onde sou 'assistant_reviewers', o currentUser.role muda e o menu atualiza.
    return item.roles.includes(this.currentUser.role);
  }

  toggleSidebar(): void {
    this.toggle.emit();
  }

  logout(): void {
    this.authService.logout();
  }

  trackByFn(index: number, item: MenuItem): string {
    return item.route + item.label;
  }
}
