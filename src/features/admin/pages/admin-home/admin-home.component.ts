import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { OrdersService } from '../../../operations/orders/services/orders.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss'],
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  stats$!: Observable<any>;
  currentDate = new Date();

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    // Admin vê dashboard global (todos os tenants)
    this.stats$ = this.ordersService.getDashboardSummary().pipe(
      shareReplay(1),
      catchError((err) => {
        console.error('Erro ao carregar dashboard admin', err);
        return of({
          totalOrders: 0,
          paymentStats: [],
          workStats: [],
          revenue: { total: 0, paid: 0 },
        });
      })
    );
  }

  ngOnDestroy(): void {}

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
