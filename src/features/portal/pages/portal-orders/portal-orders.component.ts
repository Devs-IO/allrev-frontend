import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { OrdersService } from '../../../operations/orders/services/orders.service';
import { AuthService } from '../../../../app/core/services/auth.service';

interface ClientOrder {
  id: string;
  orderNumber: string;
  contractDate: string;
  description?: string;
  paymentStatus: string;
  workStatus: string;
  amountTotal: number;
  amountPaid: number;
  client?: { id: string; name: string };
  items?: Array<{
    id: string;
    functionality?: { name: string };
    price: number;
    clientDeadline: string;
    itemStatus: string;
  }>;
  installments?: Array<{
    id: string;
    amount: number;
    dueDate: string;
    channel?: string;
    paidAt?: string;
  }>;
}

@Component({
  selector: 'app-portal-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './portal-orders.component.html',
  styleUrls: ['./portal-orders.component.scss'],
})
export class PortalOrdersComponent implements OnInit, OnDestroy {
  // Expõe Math para uso no template
  Math = Math;

  orders: ClientOrder[] = [];
  loading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalOrders = 0;

  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private ordersService: OrdersService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
    });
  }

  ngOnInit(): void {
    // Verifica se está autenticado como cliente
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user || user.role !== 'client') {
          this.router.navigate(['/portal/login']);
          return;
        }
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ordersService
      .listForClientPortal(this.currentPage + 1, this.pageSize)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.orders = response.data || [];
          this.totalOrders = response.total || 0;
          this.currentPage = (response.page || 1) - 1;
        },
        error: (err) => {
          console.error('Erro ao carregar ordens:', err);
          this.errorMessage =
            err?.error?.message ||
            'Erro ao carregar suas ordens. Tente novamente mais tarde.';
        },
      });
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.totalOrders) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'badge bg-success';
      case 'PARTIALLY_PAID':
        return 'badge bg-warning';
      case 'PENDING':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light';
    }
  }

  getWorkStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'badge bg-success';
      case 'IN_PROGRESS':
        return 'badge bg-info';
      case 'AWAITING_CLIENT':
        return 'badge bg-warning';
      case 'PENDING':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'Pago';
      case 'PARTIALLY_PAID':
        return 'Parcialmente Pago';
      case 'PENDING':
        return 'Pendente';
      default:
        return status || '—';
    }
  }

  getWorkStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'Concluído';
      case 'IN_PROGRESS':
        return 'Em Progresso';
      case 'AWAITING_CLIENT':
        return 'Aguardando Cliente';
      case 'PENDING':
        return 'Pendente';
      default:
        return status || '—';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number | undefined): string {
    if (!value && value !== 0) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  getTotalInstallments(order: ClientOrder): number {
    return order.installments?.length || 0;
  }

  getPaidInstallments(order: ClientOrder): number {
    return order.installments?.filter((inst) => inst.paidAt).length || 0;
  }

  getRemainingAmount(order: ClientOrder): number {
    return (order.amountTotal || 0) - (order.amountPaid || 0);
  }

  viewOrderDetails(orderId: string): void {
    // Pode redirecionar para uma página de detalhe se necessário
    // Por enquanto, apenas expandir inline ou abrir modal
    console.log('Visualizar ordem:', orderId);
  }
}
