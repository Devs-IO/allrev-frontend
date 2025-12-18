import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, forkJoin, Observable, Subject, of } from 'rxjs';
import {
  debounceTime,
  switchMap,
  take,
  takeUntil,
  tap,
  catchError,
} from 'rxjs/operators';

import {
  OrdersService,
  IListOrdersFilter,
  PaginatedOrders,
} from '../../services/orders.service';
import { OrderResponseDto as IOrder } from '../../interfaces/order.interface';
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { UsersService } from '../../../../admin/users/services/users.service';
import { AuthService } from '../../../../../app/core/services/auth.service';
import { Role } from '../../../../../app/core/enum/roles.enum';

// Tipos auxiliares
interface ServiceRow {
  orderId: string;
  orderNumber: string;
  clientName: string;
  itemName: string;
  responsibleName: string;
  deadline: string;
  status: string;
  price: number;
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
})
export class OrdersListComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;

  // Dados
  orders$ = new BehaviorSubject<IOrder[]>([]);
  serviceRows$ = new BehaviorSubject<ServiceRow[]>([]);
  isLoading$ = new BehaviorSubject<boolean>(false);

  // Controle de Permissão
  isManager = false;
  viewMode: 'MANAGERIAL' | 'OPERATIONAL' = 'MANAGERIAL';

  // Filtros (Combos)
  clients$!: Observable<any[]>;
  functionalities$!: Observable<any[]>;
  users$!: Observable<any[]>;

  // Listas locais
  clientsList: any[] = [];
  functionalitiesList: any[] = [];
  usersList: any[] = [];

  // Paginação
  totalOrders = 0;
  pageSize = 20;
  currentPage = 0;

  private destroy$ = new Subject<void>();
  private filtersTrigger$ = new BehaviorSubject<IListOrdersFilter>({
    page: 1,
    pageSize: this.pageSize,
  });

  // Voltamos ao padrão CONSTRUCTOR (Original)
  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Identificar Perfil (Correção do Erro 401)
    this.authService
      .getUserCached()
      .pipe(take(1))
      .subscribe((user) => {
        this.isManager = user
          ? [Role.MANAGER_REVIEWERS, Role.ADMIN].includes(user.role)
          : false;

        // Se for assistente, força o modo Operacional
        if (!this.isManager) {
          this.viewMode = 'OPERATIONAL';
        }
      });

    this.buildFilterForm();
    this.loadFilterDataAndSubscribeToOrders();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleViewMode(mode: 'MANAGERIAL' | 'OPERATIONAL'): void {
    this.viewMode = mode;
  }

  private buildFilterForm(): void {
    this.filterForm = this.fb.group({
      clientId: [''],
      functionalityId: [''],
      responsibleId: [''],
      from: [null],
      to: [null],
      paymentStatus: [''],
      workStatus: [''],
    });
  }

  private loadFilterDataAndSubscribeToOrders(): void {
    // Carrega filtros básicos com tratamento de erro
    this.clients$ = this.clientsService
      .getClients()
      .pipe(catchError(() => of([])));
    this.functionalities$ = this.functionalitiesService
      .getAll()
      .pipe(catchError(() => of([])));

    // --- LÓGICA DE PROTEÇÃO DO ASSISTENTE ---
    // Se for Gerente, carrega usuários. Se for Assistente, retorna lista vazia para não dar 401.
    if (this.isManager) {
      this.users$ = this.usersService.getUsers().pipe(catchError(() => of([])));
    } else {
      this.users$ = of([]);
    }

    forkJoin({
      clients: this.clients$.pipe(take(1)),
      functionalities: this.functionalities$.pipe(take(1)),
      users: this.users$.pipe(take(1)),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ clients, functionalities, users }) => {
        this.clientsList = clients;
        this.functionalitiesList = functionalities;
        this.usersList = users;
        this.setupOrdersSubscription();
      });
  }

  private setupOrdersSubscription(): void {
    this.filtersTrigger$
      .pipe(
        switchMap((filters) => {
          this.isLoading$.next(true);
          const formValues = this.filterForm.value;
          const combinedFilters: IListOrdersFilter = {
            ...filters,
            ...formValues,
            clientId: formValues.clientId || undefined,
            functionalityId: formValues.functionalityId || undefined,
            responsibleId: formValues.responsibleId || undefined,
            paymentStatus: formValues.paymentStatus || undefined,
            workStatus: formValues.workStatus || undefined,
            from: formValues.from || undefined,
            to: formValues.to || undefined,
          };
          return this.ordersService.getAllOrders(combinedFilters).pipe(
            catchError((err) => {
              console.error('Erro ao buscar ordens', err);
              this.isLoading$.next(false);
              return of({ data: [], total: 0, page: 1, pageSize: 20 });
            })
          );
        }),
        tap((response: PaginatedOrders) => {
          this.orders$.next(response.data);
          this.totalOrders = response.total;
          this.generateServiceRows(response.data);
          this.isLoading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private generateServiceRows(orders: IOrder[]): void {
    const rows: ServiceRow[] = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName: this.getClientName(order.client.id),
          itemName: this.getFunctionalityName(item.functionality?.id),
          responsibleName: this.getResponsibleName(item.responsible?.userId),
          deadline: item.clientDeadline as unknown as string,
          status: item.itemStatus,
          price: item.price,
        });
      });
    });

    rows.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
    this.serviceRows$.next(rows);
  }

  private setupFormSubscription(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 0;
        this.filtersTrigger$.next({ page: 1, pageSize: this.pageSize });
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      clientId: '',
      functionalityId: '',
      responsibleId: '',
      from: null,
      to: null,
      paymentStatus: '',
      workStatus: '',
    });
  }

  viewDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  goToCreateOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  handlePageEvent(pageIndex: number): void {
    this.currentPage = pageIndex;
    this.filtersTrigger$.next({
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    });
  }

  // --- Helpers de UI ---

  getComputedPaymentStatus(order: IOrder): string {
    if (!order) return 'PENDING';

    const paid = this.getComputedAmountPaid(order);

    if (paid >= order.amountTotal) return 'PAID';
    if (paid > 0) return 'PARTIALLY_PAID';
    return 'PENDING';
  }

  private getComputedAmountPaid(order: IOrder): number {
    // Usa amountPaid se vier atualizado; senão soma parcelas marcadas como pagas
    if (order.amountPaid && order.amountPaid > 0) {
      return order.amountPaid;
    }

    if (order.installments?.length) {
      return order.installments
        .filter((i) => !!i.paidAt)
        .reduce((sum, i) => sum + (i.amount || 0), 0);
    }

    return 0;
  }

  getComputedWorkStatus(order: IOrder): string {
    if (!order?.items?.length) return order?.workStatus || 'PENDING';

    const statuses = order.items.map((i) => i.itemStatus);
    if (statuses.some((s) => s === 'OVERDUE')) return 'OVERDUE';

    const allFinished = statuses.every((s) =>
      ['FINISHED', 'COMPLETED', 'DELIVERED', 'CANCELED'].includes(s)
    );
    if (allFinished) return 'FINISHED';

    if (
      statuses.some((s) =>
        ['IN_PROGRESS', 'AWAITING_CLIENT', 'AWAITING_ADVISOR'].includes(s)
      )
    ) {
      return 'IN_PROGRESS';
    }

    return order.workStatus || 'PENDING';
  }

  getClientName(clientId: string | undefined): string {
    if (!clientId) return '—';
    return this.clientsList.find((c) => c.id === clientId)?.name || '—';
  }

  getFunctionalityName(funcId: string | undefined): string {
    if (!funcId) return '—';
    return this.functionalitiesList.find((f) => f.id === funcId)?.name || '—';
  }

  getResponsibleName(userId: string | undefined): string {
    if (!userId) return '—';
    const user = this.usersList.find((u) => u.id === userId);
    return user?.name || 'Externo';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Andamento',
      AWAITING_CLIENT: 'Aguard. Cliente',
      AWAITING_ADVISOR: 'Aguard. Revisor',
      FINISHED: 'Finalizado',
      COMPLETED: 'Concluído',
      CANCELED: 'Cancelado',
      OVERDUE: 'Atrasado',
      PAID: 'Pago',
      PARTIALLY_PAID: 'Parcial',
    };
    return map[status] || status;
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
      case 'CANCELED':
        return 'bg-secondary-subtle text-secondary border-secondary';
      default:
        return 'bg-warning-subtle text-warning border-warning';
    }
  }

  // --- RESTAURADO: Gerador de cor para Avatar ---
  getAvatarColor(name: string): string {
    const colors = [
      '#57040F', // Vinho primário
      '#8D201B', // Vinho secundário
      '#be6460', // Vinho terciário
      '#6B4423', // Marrom
      '#2C5F2D', // Verde escuro
      '#1B4965', // Azul escuro
      '#6B2D5C', // Roxo
      '#8B4513', // Marrom médio
    ];

    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
