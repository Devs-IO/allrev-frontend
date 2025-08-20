import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrdersService, PaginatedOrders } from '../../services/orders.service';
import { BrDatepickerDirective } from '../../../../app/core/directives/br-datepicker.directive';
import { OrderResponseDto } from '../../../../app/shared/models/orders';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    BrDatepickerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./orders-list.component.scss'],
  template: `
    <div class="orders-list container p-4 mx-auto max-w-6xl">
      <!-- Toolbar -->
      <div
        class="orders-list-toolbar d-flex align-items-center justify-content-between mb-3"
      >
        <h1 class="h5 m-0">Ordens</h1>
        <div class="d-flex gap-2">
          <a
            class="btn btn-primary btn-sm"
            [routerLink]="['/orders/create']"
            aria-label="Criar nova ordem"
          >
            <i class="bi bi-plus-circle me-1"></i> Novo
          </a>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            (click)="toggleFilter()"
            aria-label="Mostrar filtros"
          >
            <i class="bi bi-funnel me-1"></i> Filtrar
          </button>
        </div>
      </div>

      <!-- Chips de filtros ativos -->
      <div
        class="orders-list-chips d-flex flex-wrap gap-2 mb-3"
        *ngIf="chips.length"
      >
        <span class="badge bg-secondary" *ngFor="let c of chips">
          <i class="bi me-1" [ngClass]="c.icon"></i>{{ c.label }}
          <button
            class="btn btn-sm btn-link p-0 ms-2 text-light"
            (click)="removeChip(c.key)"
            aria-label="Remover filtro"
          >
            <i class="bi bi-x"></i>
          </button>
        </span>
      </div>

      <!-- Painel de Filtro (colapsável) -->
      <form
        *ngIf="filterOpen"
        [formGroup]="filters"
        (ngSubmit)="applyFilters(true)"
        class="orders-list-filter card card-body mb-3"
      >
        <div class="row g-3">
          <div class="col-12 col-md-3">
            <label class="form-label small">Pagamento</label>
            <select
              class="form-select form-select-sm"
              formControlName="paymentStatus"
            >
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let p of paymentStatuses" [value]="p">
                {{ p }}
              </option>
            </select>
          </div>
          <div class="col-12 col-md-3">
            <label class="form-label small">Status</label>
            <select
              class="form-select form-select-sm"
              formControlName="workStatus"
            >
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let s of workStatuses" [value]="s">
                {{ s }}
              </option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label small">De</label>
            <input
              type="text"
              class="form-control form-control-sm"
              formControlName="from"
              appBrDatepicker
              (dateChange)="onDateChange('from', $event)"
              [value]="filters.get('from')!.value"
            />
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label small">Até</label>
            <input
              type="text"
              class="form-control form-control-sm"
              formControlName="to"
              appBrDatepicker
              (dateChange)="onDateChange('to', $event)"
              [value]="filters.get('to')!.value"
            />
          </div>
          <div class="col-12 col-md-2">
            <label class="form-label small">Cliente</label>
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Nome do cliente"
              formControlName="client"
            />
          </div>
        </div>
        <div class="d-flex gap-2 justify-content-end mt-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            aria-label="Limpar filtros"
            (click)="resetFilters()"
          >
            Limpar
          </button>
          <button
            type="submit"
            class="btn btn-sm btn-primary"
            aria-label="Aplicar filtros"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      <!-- Filtros rápidos de atribuição -->
      <div
        class="orders-list-quick mb-3 d-flex flex-wrap gap-3 align-items-center"
      >
        <label class="form-check-label d-flex align-items-center gap-2">
          <input
            type="checkbox"
            class="form-check-input"
            [(ngModel)]="onlyMine"
            name="onlyMine"
          />
          Só minhas atribuições
        </label>
        <label class="form-check-label d-flex align-items-center gap-2">
          <input
            type="checkbox"
            class="form-check-input"
            [(ngModel)]="onlyAuto"
            name="onlyAuto"
          />
          Auto-atribuídas
        </label>
        <label class="form-check-label d-flex align-items-center gap-2">
          <input
            type="checkbox"
            class="form-check-input"
            [(ngModel)]="onlyByOthers"
            name="onlyByOthers"
          />
          Atribuídas por outros
        </label>
        <button
          class="btn btn-sm btn-outline-secondary ms-auto"
          (click)="clearQuickFilters()"
        >
          Limpar
        </button>
      </div>

      <!-- Accordion por cliente -->
      <div class="orders-list-groups" *ngIf="groups.length; else emptyState">
        <div
          class="orders-list-group card mb-3"
          *ngFor="let g of groups; trackBy: trackByGroup"
        >
          <div
            class="card-header d-flex align-items-center justify-content-between"
            (click)="g.open = !g.open"
            role="button"
            [attr.aria-expanded]="g.open"
          >
            <div class="d-flex align-items-center gap-3">
              <strong>{{ g.clientName || g.clientId }}</strong>
              <span class="badge text-bg-secondary"
                >Em aberto: {{ formatPtBR(g.totalOutstanding) }}</span
              >
              <span class="text-muted small"
                >Total em ordens: {{ formatPtBR(g.totalOrdersAmount) }}</span
              >
            </div>
            <i
              class="bi"
              [ngClass]="g.open ? 'bi-chevron-up' : 'bi-chevron-down'"
            ></i>
          </div>
          <div class="card-body p-0" *ngIf="g.open">
            <div class="table-responsive orders-list-table m-0">
              <table class="table table-sm align-middle m-0">
                <thead>
                  <tr>
                    <th style="width: 110px;">Order #</th>
                    <th class="text-end" style="width: 140px;">Valor Total</th>
                    <th class="text-end" style="width: 120px;">Pago</th>
                    <th style="width: 140px;">Pagamento</th>
                    <th style="width: 140px;">Trabalho</th>
                    <th style="width: 160px;">Prazo</th>
                    <th>Serviço(s)</th>
                    <th class="text-end" style="width: 140px;">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container
                    *ngFor="let row of g.orders; trackBy: trackByOrder"
                  >
                    <tr>
                      <td>
                        <a
                          [routerLink]="['/orders', row.id]"
                          class="text-decoration-none"
                          >{{ row.orderNumber }}</a
                        >
                      </td>
                      <td class="text-end fw-semibold">
                        {{ formatPtBR(row.amountTotal) }}
                      </td>
                      <td class="text-end">{{ formatPtBR(row.amountPaid) }}</td>
                      <td>
                        <span class="badge bg-light text-dark">{{
                          row.paymentStatus
                        }}</span>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark">{{
                          row.workStatus
                        }}</span>
                      </td>
                      <td>
                        <span [ngClass]="row.dueClass">{{
                          row.nextDueDate ? toPtDate(row.nextDueDate) : '-'
                        }}</span>
                      </td>
                      <td>
                        <span [attr.title]="row.servicesNames.join(', ') || ''"
                          >{{ row.servicesCount }} serviços</span
                        >
                        <span class="ms-2" *ngFor="let chip of row.chips">
                          <span class="badge rounded-pill text-bg-info">{{
                            chip
                          }}</span>
                        </span>
                      </td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <button
                            type="button"
                            class="btn btn-outline-secondary"
                            (click)="
                              toggleInline(row); $event.stopPropagation()
                            "
                            [attr.aria-expanded]="isOpen(row)"
                          >
                            V
                          </button>
                          <a
                            [routerLink]="['/orders', row.id]"
                            class="btn btn-primary"
                            >Ver</a
                          >
                        </div>
                      </td>
                    </tr>
                    <!-- resumo inline -->
                    <tr *ngIf="isOpen(row)">
                      <td colspan="8" class="bg-body-tertiary">
                        <div class="p-3">
                          <div class="table-responsive">
                            <table class="table table-sm">
                              <thead>
                                <tr>
                                  <th>Serviço</th>
                                  <th>Assistentes</th>
                                  <th class="text-end">Valor a pagar</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  *ngFor="
                                    let it of row.items;
                                    trackBy: trackByItem
                                  "
                                >
                                  <td>
                                    {{
                                      it.functionalityName || it.functionalityId
                                    }}
                                  </td>
                                  <td>{{ getAssistantsNames(it) || '-' }}</td>
                                  <td class="text-end">
                                    {{ formatPtBR(getAssistantsAmount(it)) }}
                                  </td>
                                </tr>
                                <tr class="fw-semibold">
                                  <td colspan="2" class="text-end">
                                    Subtotal assistentes
                                  </td>
                                  <td class="text-end">
                                    {{
                                      formatPtBR(
                                        getOrderAssistantsSubtotal(row)
                                      )
                                    }}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="text-center py-5 text-muted">
          <i class="bi bi-receipt fs-3 d-block mb-2"></i>
          Nenhuma ordem encontrada.
          <a
            class="btn btn-sm btn-primary ms-2"
            [routerLink]="['/orders/create']"
            >Criar ordem</a
          >
        </div>
      </ng-template>

      <!-- Paginação -->
      <div class="flex items-center justify-between mt-3 text-sm">
        <div class="flex items-center gap-2">
          <span>Página {{ page }} de {{ totalPages }}</span>
          <span>•</span>
          <label>por página</label>
          <select
            class="border rounded p-1"
            [value]="pageSize"
            (change)="changePageSize($any($event.target).value)"
          >
            <option [ngValue]="10">10</option>
            <option [ngValue]="20">20</option>
            <option [ngValue]="50">50</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-outline-secondary"
            [disabled]="page <= 1"
            (click)="goPage(page - 1)"
          >
            Anterior
          </button>
          <button
            class="btn btn-sm btn-outline-secondary"
            [disabled]="page >= totalPages"
            (click)="goPage(page + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  private orders = inject(OrdersService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  filters: FormGroup = this.fb.group({
    paymentStatus: [null],
    workStatus: [null],
    from: [''],
    to: [''],
    client: [''], // free text, backend may ignore if unsupported
  });

  paymentStatuses: string[] = ['PENDING', 'PARTIALLY_PAID', 'PAID'];
  workStatuses: string[] = [
    'PENDING',
    'IN_PROGRESS',
    'AWAITING_CLIENT',
    'AWAITING_ADVISOR',
    'OVERDUE',
    'FINISHED',
    'DELIVERED',
    'CANCELED',
  ];

  rows: OrderResponseDto[] = [];
  groups: Array<{
    clientId: string;
    clientName?: string;
    orders: AugOrder[];
    totalOrdersAmount: number;
    totalOutstanding: number;
    open: boolean;
  }> = [];
  total = 0;
  page = 1;
  pageSize = 10;
  filterOpen = false;
  chips: Array<{ key: string; label: string; icon: string }> = [];
  // quick filters
  onlyMine = false;
  onlyAuto = false;
  onlyByOthers = false;
  // inline expansion state
  private openRows = new Set<string>();
  private currentUserId: string | null = null;

  ngOnInit(): void {
    // restore filter panel state
    const saved = localStorage.getItem('orders.filter.open');
    this.filterOpen = saved === 'true';
    // load current user first (best effort)
    this.auth.getCurrentUser$().subscribe((u) => {
      this.currentUserId = u?.id || null;
      this.load();
    });
  }

  toggleFilter() {
    this.filterOpen = !this.filterOpen;
    localStorage.setItem('orders.filter.open', String(this.filterOpen));
  }

  onDateChange(control: 'from' | 'to', ddmmyyyy: string) {
    this.filters.get(control)!.setValue(ddmmyyyy);
  }

  applyFilters(close = false) {
    this.page = 1;
    this.load();
    if (close) {
      this.filterOpen = false;
      localStorage.setItem('orders.filter.open', 'false');
    }
  }
  resetFilters() {
    this.filters.reset({
      paymentStatus: null,
      workStatus: null,
      from: '',
      to: '',
      client: '',
    });
    this.page = 1;
    this.load();
  }

  changePageSize(n: number | string) {
    this.pageSize = Number(n) || 10;
    this.page = 1;
    this.load();
  }
  goPage(p: number) {
    if (p < 1) return;
    this.page = p;
    this.load();
  }

  load() {
    const f = this.filters.value as any;
    const params: any = {
      page: this.page,
      pageSize: this.pageSize,
    };
    if (f.paymentStatus) params.paymentStatus = f.paymentStatus;
    if (f.workStatus) params.workStatus = f.workStatus;
    if (f.from) params.from = this.toIso(f.from);
    if (f.to) params.to = this.toIso(f.to);
    if (f.client) params.client = f.client; // backend may support textual search

    this.orders.list(params).subscribe((res: PaginatedOrders) => {
      this.rows = res.data || [];
      this.total = res.total || 0;
      this.page = res.page || this.page;
      this.pageSize = res.pageSize || this.pageSize;
      this.buildChips();
      // derive, group, and apply quick filters
      const derived = this.rows.map((o) => this.augment(o));
      this.groups = this.buildGroups(derived);
    });
  }

  buildChips() {
    const f = this.filters.value as any;
    const chips: Array<{ key: string; label: string; icon: string }> = [];
    if (f.paymentStatus)
      chips.push({
        key: 'paymentStatus',
        label: `Pagamento: ${f.paymentStatus}`,
        icon: 'bi-cash-stack',
      });
    if (f.workStatus)
      chips.push({
        key: 'workStatus',
        label: `Status: ${f.workStatus}`,
        icon: 'bi-briefcase',
      });
    if (f.from)
      chips.push({ key: 'from', label: `De: ${f.from}`, icon: 'bi-calendar' });
    if (f.to)
      chips.push({ key: 'to', label: `Até: ${f.to}`, icon: 'bi-calendar2' });
    if (f.client)
      chips.push({
        key: 'client',
        label: `Cliente: ${f.client}`,
        icon: 'bi-person',
      });
    this.chips = chips;
  }
  removeChip(key: string) {
    const ctrl = this.filters.get(key as any);
    if (!ctrl) return;
    ctrl.setValue(key === 'paymentStatus' || key === 'workStatus' ? null : '');
    this.applyFilters();
  }

  // helpers
  open(row: OrderResponseDto) {
    this.router.navigate(['/orders', row.id]);
  }
  toIso(ddmmyyyy: string): string {
    if (!ddmmyyyy) return '';
    const [dd, mm, yyyy] = ddmmyyyy.split('/').map((s: string) => Number(s));
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(
      2,
      '0'
    )}`;
  }
  toPtDate(isoOrYmd: string | null | undefined): string {
    if (!isoOrYmd) return '';
    const s = String(isoOrYmd);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mm, dd] = m;
      return `${dd}/${mm}/${y}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return s;
  }
  formatPtBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n || 0);
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil((this.total || 0) / (this.pageSize || 10)));
  }
  trackByOrder = (_: number, row: OrderResponseDto) => row.id;
  trackByGroup = (_: number, g: { clientId: string }) => g.clientId;
  trackByItem = (_: number, it: any) => it.id || it.functionalityId;

  // Derived helpers
  private augment(o: OrderResponseDto): AugOrder {
    const items = o.items || [];
    const installments = o.installments || [];
    const unpaid = installments.filter((i) => !i.paidAt);
    const next = unpaid.length
      ? unpaid
          .map((i) => i.dueDate)
          .filter(Boolean)
          .sort()[0]
      : null;

    const amountOutstanding = Math.max(
      0,
      (o.amountTotal || 0) - (o.amountPaid || 0)
    );
    const servicesCount = items.length;
    const servicesNames = items.map(
      (i) => i.functionalityName || i.functionalityId
    );

    const asstFlags = this.computeAssignFlags(o);
    const chips: string[] = [];
    if (asstFlags.asAssistant) chips.push('Eu responsável');
    if (asstFlags.selfAssigned) chips.push('Auto-atribuída');
    if (asstFlags.assignedByOthers) chips.push('Atribuída por gerente');

    // due coloring: skip if finished/delivered/canceled
    const work = String(o.workStatus || '').toUpperCase();
    const skipColor = [
      'FINISHED',
      'DELIVERED',
      'CANCELED',
      'COMPLETED',
    ].includes(work);
    let dueClass = '';
    if (!skipColor && next) {
      const today = new Date();
      const nextDate = new Date(next as string);
      const diffDays = Math.floor(
        (nextDate.getTime() - this.startOfDay(today).getTime()) / 86400000
      );
      if (nextDate < this.startOfDay(today)) dueClass = 'text-danger';
      else if (diffDays >= 0 && diffDays <= 3) dueClass = 'text-warning';
    }

    return {
      ...o,
      nextDueDate: next || null,
      dueClass,
      amountOutstanding,
      servicesCount,
      servicesNames,
      chips,
      flags: asstFlags,
    } as AugOrder;
  }

  private buildGroups(rows: AugOrder[]) {
    // apply quick filters first
    const filtered = rows.filter((r) => {
      if (this.onlyMine && !r.flags.asAssistant) return false;
      if (this.onlyAuto && !r.flags.selfAssigned) return false;
      if (this.onlyByOthers && !r.flags.assignedByOthers) return false;
      return true;
    });
    const map = new Map<
      string,
      { clientId: string; clientName?: string; orders: AugOrder[] }
    >();
    for (const r of filtered) {
      const key = r.clientId;
      if (!map.has(key))
        map.set(key, {
          clientId: r.clientId,
          clientName: r.clientName,
          orders: [],
        });
      map.get(key)!.orders.push(r);
    }
    const groups = Array.from(map.values()).map((g) => {
      const totalOrdersAmount = g.orders.reduce(
        (s, it) => s + (it.amountTotal || 0),
        0
      );
      const totalOutstanding = g.orders.reduce(
        (s, it) => s + (it.amountOutstanding || 0),
        0
      );
      return { ...g, totalOrdersAmount, totalOutstanding, open: true };
    });
    return groups;
  }

  private computeAssignFlags(o: OrderResponseDto) {
    const uid = this.currentUserId;
    let asAssistant = false;
    let selfAssigned = false;
    let assignedByOthers = false;
    for (const it of o.items || []) {
      // responsibilities array if present
      const anyIt: any = it as any;
      const respList: any[] = Array.isArray(anyIt.responsibilities)
        ? anyIt.responsibilities
        : [];
      if (respList.length) {
        for (const r of respList) {
          if (uid && (r.userId === uid || r.user?.id === uid)) {
            asAssistant = true;
            if (r.assignedByUserId && uid) {
              if (r.assignedByUserId === uid) selfAssigned = true;
              else assignedByOthers = true;
            }
          }
        }
      } else {
        // fallback: responsibleUserId
        if (uid && it.responsibleUserId === uid) {
          asAssistant = true;
        }
      }
    }
    return { asAssistant, selfAssigned, assignedByOthers };
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Inline summary controls
  toggleInline(row: { id: string }) {
    if (this.openRows.has(row.id)) this.openRows.delete(row.id);
    else this.openRows.add(row.id);
  }
  isOpen(row: { id: string }) {
    return this.openRows.has(row.id);
  }

  // Assistants info
  getAssistantsNames(it: any): string {
    const resp: any[] = Array.isArray(it?.responsibilities)
      ? it.responsibilities
      : [];
    if (resp.length) {
      const names = resp
        .map((r) => r.user?.name || r.userName || r.name)
        .filter(Boolean);
      return names.join(', ');
    }
    return it.responsibleUserName || '';
  }
  getAssistantsAmount(it: any): number {
    const resp: any[] = Array.isArray(it?.responsibilities)
      ? it.responsibilities
      : [];
    if (resp.length) {
      return resp.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    }
    return Number(it.amountForAssistant) || 0;
  }
  getOrderAssistantsSubtotal(o: any): number {
    return (o.items || []).reduce(
      (s: number, it: any) => s + this.getAssistantsAmount(it),
      0
    );
  }

  clearQuickFilters() {
    this.onlyMine = this.onlyAuto = this.onlyByOthers = false;
    // rebuild groups with no quick filters
    const derived = this.rows.map((o) => this.augment(o));
    this.groups = this.buildGroups(derived);
  }
}

// Augmented order shape used in list rendering
interface AugOrder extends OrderResponseDto {
  nextDueDate: string | null;
  dueClass: string;
  amountOutstanding: number;
  servicesCount: number;
  servicesNames: string[];
  chips: string[];
  flags: {
    asAssistant: boolean;
    selfAssigned: boolean;
    assignedByOthers: boolean;
  };
}
