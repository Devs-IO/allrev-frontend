import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss'],
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  currentDate = new Date();

  // Dados placeholder para admin (sem chamada ao backend)
  adminStats = {
    activeTenants: 0,
    totalUsers: 0,
    overduePayments: 0,
  };

  constructor() {}

  ngOnInit(): void {
    // Admin não carrega dados de ordens
    // Apenas exibe placeholders
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
