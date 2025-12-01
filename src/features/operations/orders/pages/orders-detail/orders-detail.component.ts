import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../../../app/core/services/toast.service';
import {
  OrderResponseDto,
  OrderItem,
  OrderInstallment,
} from '../../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-detail.component.html',
  styleUrls: ['./orders-detail.component.scss'],
})
export class OrdersDetailComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);

  order?: OrderResponseDto;
  isLoading = false;

  // Controle de loading individual
  loadingItems: Record<string, boolean> = {};

  // Controle Manual do Dropdown (ID do item cujo menu está aberto)
  openDropdownId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  // Fecha dropdowns se clicar fora
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openDropdownId = null;
      this.cdr.markForCheck();
    }
  }

  toggleDropdown(event: Event, itemId: string) {
    event.stopPropagation(); // Impede que o clickOutside feche imediatamente
    if (this.openDropdownId === itemId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = itemId;
    }
    this.cdr.markForCheck(); // Atualiza a tela
  }

  load(id: string): void {
    this.isLoading = true;
    this.ordersService.findOne(id).subscribe({
      next: (data) => {
        this.order = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error('Erro ao carregar ordem');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // --- Ações ---

  changeItemStatus(item: OrderItem, newStatus: string): void {
    if (!this.order) return;
    this.openDropdownId = null; // Fecha o menu

    if (item.itemStatus === newStatus) return;

    this.loadingItems[item.id] = true;
    this.cdr.markForCheck();

    this.ordersService
      .updateItemStatus(this.order.id, item.id, newStatus)
      .subscribe({
        next: () => {
          // Atualiza localmente para feedback instantâneo (ou recarrega tudo se preferir)
          item.itemStatus = newStatus as any;
          this.toast.success('Status atualizado!');
          this.loadingItems[item.id] = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toast.error('Erro ao atualizar status.');
          this.loadingItems[item.id] = false;
          this.cdr.markForCheck();
        },
      });
  }

  payInstallment(inst: OrderInstallment): void {
    if (!this.order) return;
    if (confirm(`Confirmar pagamento de ${this.formatMoney(inst.amount)}?`)) {
      this.loadingItems[inst.id] = true;
      this.cdr.markForCheck();

      const today = new Date().toISOString();

      this.ordersService
        .payInstallment(this.order.id, inst.id, today)
        .subscribe({
          next: (updatedOrder) => {
            // Atualiza a ordem inteira pois o backend pode ter recalculado algo
            this.order = updatedOrder;
            this.toast.success('Pagamento confirmado!');
            this.loadingItems[inst.id] = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error(err);
            this.toast.error('Erro ao processar pagamento.');
            this.loadingItems[inst.id] = false;
            this.cdr.markForCheck();
          },
        });
    }
  }

  // --- Cálculos Financeiros ---

  // Quanto vou pagar (Total Custo)
  get totalCost(): number {
    return (
      this.order?.items.reduce(
        (acc, item) => acc + (item.responsible?.amount || 0),
        0
      ) || 0
    );
  }

  // Quanto vou receber de verdade (Lucro Líquido)
  get netProfit(): number {
    return (this.order?.amountTotal || 0) - this.totalCost;
  }

  get profitMargin(): number {
    if (!this.order?.amountTotal) return 0;
    return (this.netProfit / this.order.amountTotal) * 100;
  }

  // --- Helpers UI ---

  formatMoney(val: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
      case 'FINISHED':
      case 'PAID':
        return 'bg-success-subtle text-success border-success';
      case 'IN_PROGRESS':
      case 'PARTIALLY_PAID':
        return 'bg-info-subtle text-info border-info';
      case 'OVERDUE':
        return 'bg-danger-subtle text-danger border-danger';
      case 'PENDING':
        return 'bg-warning-subtle text-warning border-warning';
      default:
        return 'bg-secondary-subtle text-secondary border-secondary';
    }
  }

  isOverdue(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    d.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return d < now;
  }
}
