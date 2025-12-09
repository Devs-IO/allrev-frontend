import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantsService } from '../../tenants/services/tenants.service';
import { UsersService } from '../../users/services/users.service';
import { OrdersService } from '../../../operations/orders/services/orders.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss'],
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private tenantsService = inject(TenantsService);
  private usersService = inject(UsersService);
  private ordersService = inject(OrdersService);

  currentDate = new Date();

  adminStats = {
    activeTenants: 0,
    totalUsers: 0,
    overduePayments: 0,
  };

  constructor() {}

  ngOnInit(): void {
    this.loadAdminStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAdminStats(): void {
    forkJoin({
      tenants: this.tenantsService.getTenants(),
      users: this.usersService.getUsers(),
      dashboard: this.ordersService.getDashboardSummary(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tenants, users, dashboard }) => {
          this.adminStats.activeTenants = tenants?.length || 0;
          this.adminStats.totalUsers = users?.length || 0;

          // Calcula pagamentos atrasados a partir do paymentStats
          const overdueStats = dashboard?.paymentStats?.find(
            (stat: any) => stat.status === 'OVERDUE'
          );
          this.adminStats.overduePayments = overdueStats?.count || 0;
        },
        error: (err) => {
          console.error('Erro ao carregar estatísticas do admin:', err);
        },
      });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PARTIALLY_PAID: 'Parcial',
      PAID: 'Pago',
      IN_PROGRESS: 'Em Andamento',
      FINISHED: 'Finalizado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'bg-warning',
      PARTIALLY_PAID: 'bg-info',
      PAID: 'bg-success',
      IN_PROGRESS: 'bg-primary',
      FINISHED: 'bg-success',
      CANCELLED: 'bg-danger',
    };
    return classes[status] || 'bg-secondary';
  }
}
