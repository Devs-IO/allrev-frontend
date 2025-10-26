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
  template: `
    <div
      class="orders-detail container p-4 mx-auto max-w-5xl"
      *ngIf="order as o; else loadingTpl"
    >
      <!-- Resumo em cartões -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-xxl-8">
          <div class="card">
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-start mb-2"
              >
                <h1 class="h5 m-0">Ordem {{ o.orderNumber }}</h1>
                <div class="d-flex gap-2">
                  <span class="badge bg-light text-dark">{{
                    o.paymentStatus
                  }}</span>
                  <span class="badge bg-light text-dark">{{
                    o.workStatus
                  }}</span>
                </div>
              </div>
              <div class="text-muted small">
                Cliente:
                <strong class="text-body">{{
                  o.clientName || o.clientId
                }}</strong>
              </div>
              <div class="text-muted small">
                Contrato:
                <strong class="text-body">{{
                  toPtDate(o.contractDate)
                }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-xxl-4">
          <div class="card h-100">
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
                <div class="fs-5">{{ formatPtBR(o.amountTotal) }}</div>
                <small class="text-muted">Total</small>
              </div>
              <div
                class="progress"
                role="progressbar"
                aria-label="Progresso de pagamento"
                [attr.aria-valuenow]="progressPct"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div class="progress-bar" [style.width.%]="progressPct"></div>
              </div>
              <div class="small text-muted mt-1">
                {{ formatPtBR(o.amountPaid) }} de
                {{ formatPtBR(o.amountTotal) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Parcelas -->
      <div class="card mb-3">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <span>Parcelas</span>
          <button
            class="btn btn-sm btn-link"
            (click)="toggle('installments')"
            [attr.aria-expanded]="isOpen('installments')"
          >
            {{ isOpen('installments') ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
        <div class="card-body" *ngIf="isOpen('installments')">
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Pago em</th>
                  <th class="text-end">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inst of o.installments; trackBy: trackByInst">
                  <td>{{ inst.sequence }}</td>
                  <td>{{ formatPtBR(inst.amount) }}</td>
                  <td>{{ toPtDate(inst.dueDate) }}</td>
                  <td>{{ inst.paidAt ? toPtDate(inst.paidAt) : '—' }}</td>
                  <td class="text-end">
                    <button
                      class="btn btn-sm btn-success"
                      aria-label="Marcar parcela como paga"
                      (click)="markPaid(inst)"
                      [disabled]="!!inst.paidAt || paying"
                    >
                      Marcar paga
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Itens -->
      <div class="card">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <span>Itens</span>
          <button
            class="btn btn-sm btn-link"
            (click)="toggle('items')"
            [attr.aria-expanded]="isOpen('items')"
          >
            {{ isOpen('items') ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
        <div class="card-body" *ngIf="isOpen('items')">
          <div class="row g-3">
            <div
              class="col-12 col-md-6"
              *ngFor="let it of o.items; trackBy: trackByItem"
            >
              <div class="border rounded p-3 h-100">
                <div class="fw-semibold mb-1">
                  {{ it.functionalityName || it.functionalityId }}
                </div>
                <div class="text-muted small mb-1">
                  Preço:
                  <strong class="text-body">{{ formatPtBR(it.price) }}</strong>
                  • Prazo cliente:
                  <strong class="text-body">{{
                    toPtDate(it.clientDeadline)
                  }}</strong>
                </div>
                <div class="mb-2">
                  <span class="badge bg-light text-dark">{{ it.status }}</span>
                </div>
                <div class="small text-muted">
                  <div>
                    Responsável:
                    <strong class="text-body">{{
                      it.responsibleUserName || it.responsibleUserId || '—'
                    }}</strong>
                  </div>
                  <div>
                    Prazo assistente:
                    <strong class="text-body">{{
                      it.assistantDeadline
                        ? toPtDate(it.assistantDeadline)
                        : '—'
                    }}</strong>
                  </div>
                  <div>
                    Valor assistente:
                    <strong class="text-body">{{
                      it.amountForAssistant != null
                        ? formatPtBR(it.amountForAssistant)
                        : '—'
                    }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="container p-4">Carregando…</div>
    </ng-template>
  `,
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
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mm, dd] = m;
      return `${dd}/${mm}/${y}`;
    }
    // try ISO
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
  trackByItem = (_: number, i: OrderItem) => i.id ?? i.functionalityId;
}
