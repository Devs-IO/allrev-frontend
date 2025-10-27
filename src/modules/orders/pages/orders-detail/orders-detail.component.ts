import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../../app/core/services/toast.service';
import {
  OrderResponseDto,
  OrderInstallment,
  OrderItem,
} from '../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./orders-detail.component.scss'],
  // --- CORREÇÃO: Aponta para o ficheiro HTML externo ---
  templateUrl: './orders-detail.component.html',
})
export class OrdersDetailComponent implements OnInit {
  private orders = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  order?: OrderResponseDto;
  paying = false;
  private openState: Record<string, boolean> = {
    installments: true,
    items: true,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    // restore open states
    const s = localStorage.getItem('orders.detail.sections');
    if (s) {
      try {
        this.openState = { ...this.openState, ...(JSON.parse(s) || {}) };
      } catch {}
    }
  }

  load(id: string) {
    this.orders.findOne(id).subscribe({
      next: (o) => (this.order = o),
      error: () => this.toast.error('Falha ao carregar a ordem'),
    });
  }

  markPaid(inst: OrderInstallment) {
    if (!this.order || !inst?.id || inst.paidAt) return;
    this.paying = true;
    this.orders.payInstallment(this.order.id, inst.id).subscribe({
      next: (o) => {
        this.order = o;
        this.paying = false;
        this.toast.success('Parcela marcada como paga');
      },
      error: () => {
        this.paying = false;
        this.toast.error('Não foi possível marcar como paga');
      },
    });
  }

  // utils
  get progressPct(): number {
    if (!this.order) return 0;
    const total = this.order.amountTotal || 0;
    const paid = this.order.amountPaid || 0;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }
  toggle(key: 'installments' | 'items') {
    this.openState[key] = !this.openState[key];
    localStorage.setItem(
      'orders.detail.sections',
      JSON.stringify(this.openState)
    );
  }
  isOpen(key: 'installments' | 'items') {
    return !!this.openState[key];
  }
  formatPtBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n || 0);
  }
  toPtDate(isoOrYmd: string | undefined | null): string {
    if (!isoOrYmd) return '';
    const s = String(isoOrYmd);
    // Cobre o formato 'YYYY-MM-DD' vindo do 'assistantDeadline' corrigido
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mm, dd] = m;
      return `${dd}/${mm}/${y}`;
    }
    // Tenta formato ISO (para paidAt, contractDate)
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  }
  trackByInst = (_: number, i: OrderInstallment) => i.id ?? i.sequence;

  // --- CORREÇÃO: Ajusta o trackBy para o modelo de dados aninhado
  trackByItem = (_: number, i: OrderItem) => i.id ?? i.functionality.id;
}
