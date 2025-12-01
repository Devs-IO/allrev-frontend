import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);

  // --- MUDANÇA: Recebe o estado do Pai (Layout) ---
  @Input() isCollapsed = false;
  @Output() toggle = new EventEmitter<void>();

  currentUser: any;
  filteredMenu: MenuItem[] = [];

  // Configuração do Menu
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi bi-grid-1x2-fill',
      route: '/home',
      exact: true,
    },
    {
      label: 'Nova Ordem',
      icon: 'bi bi-plus-circle-dotted',
      route: '/orders/create',
      separator: true,
      exact: true,
    },
    {
      label: 'Ordens / Vendas',
      icon: 'bi bi-receipt',
      route: '/orders',
      exact: true, // --- CORREÇÃO: Isso impede que fique colorido ao entrar em "Nova Ordem" ---
    },
    {
      label: 'Relatórios',
      icon: 'bi bi-bar-chart-fill',
      route: '/reports',
    },
    {
      label: 'Clientes',
      icon: 'bi bi-people-fill',
      route: '/clients',
    },
    {
      label: 'Serviços',
      icon: 'bi bi-tools',
      route: '/functionalities',
      separator: true,
    },
    {
      label: 'Usuários',
      icon: 'bi bi-person-badge',
      route: '/users',
    },
    {
      label: 'Configurações',
      icon: 'bi bi-gear',
      route: '/settings',
      separator: true,
    },
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getUserCached();
    this.filteredMenu = this.menuItems;
  }

  // Emite o evento para o Layout ajustar a margem
  toggleSidebar(): void {
    this.toggle.emit();
  }

  logout(): void {
    this.authService.logout();
  }

  trackByFn(index: number, item: MenuItem): string {
    return item.route;
  }
}
