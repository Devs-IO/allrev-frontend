import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, forkJoin, Observable, Subject } from 'rxjs';
import { debounceTime, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import {
  OrdersService,
  IListOrdersFilter,
  PaginatedOrders,
} from '../../services/orders.service';
import {
  OrderResponseDto as IOrder,
  OrderItem,
} from '../../interfaces/order.interface';
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { UsersService } from '../../../../admin/users/services/users.service';

// Tipos auxiliares para a visão de Serviços
interface ServiceRow {
  orderId: string;
  orderNumber: string;
  clientName: string;
  itemName: string; // Nome da funcionalidade
  responsibleName: string;
  deadline: string; // Prazo do cliente
  status: string; // Status do item (trabalho)
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

  // Dados brutos (Ordens)
  orders$ = new BehaviorSubject<IOrder[]>([]);

  // Dados processados para a visão de serviços
  serviceRows$ = new BehaviorSubject<ServiceRow[]>([]);

  isLoading$ = new BehaviorSubject<boolean>(false);

  // Controle de Visualização
  viewMode: 'MANAGERIAL' | 'OPERATIONAL' = 'MANAGERIAL'; // Gerencial (Cliente) vs Operacional (Serviços)

  // Filtros (Combos)
  clients$!: Observable<any[]>;
  functionalities$!: Observable<any[]>;
  users$!: Observable<any[]>;

  // Listas locais para tradução rápida
  clientsList: any[] = [];
  functionalitiesList: any[] = [];
  usersList: any[] = [];

  // Paginação
  totalOrders = 0;
  pageSize = 20; // Aumentei o default para caber mais na tela compacta
  currentPage = 0;

  private destroy$ = new Subject<void>();
  private filtersTrigger$ = new BehaviorSubject<IListOrdersFilter>({
    page: 1,
    pageSize: this.pageSize,
  });

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
    this.clients$ = this.clientsService.getClients();
    this.functionalities$ = this.functionalitiesService.getAll();
    this.users$ = this.usersService.getUsers();

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
            // Limpa strings vazias
            clientId: formValues.clientId || undefined,
            functionalityId: formValues.functionalityId || undefined,
            responsibleId: formValues.responsibleId || undefined,
            paymentStatus: formValues.paymentStatus || undefined,
            workStatus: formValues.workStatus || undefined,
            from: formValues.from || undefined,
            to: formValues.to || undefined,
          };
          return this.ordersService.getAllOrders(combinedFilters);
        }),
        tap((response: PaginatedOrders) => {
          this.orders$.next(response.data);
          this.totalOrders = response.total;

          // Gera a lista "achatada" para a visão operacional
          this.generateServiceRows(response.data);

          this.isLoading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // Transforma Ordens (Hierárquico) em Lista de Serviços (Flat)
  private generateServiceRows(orders: IOrder[]): void {
    const rows: ServiceRow[] = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName: this.getClientName(order.client.id),
          itemName: this.getFunctionalityName(item.functionality?.id),
          responsibleName: this.getResponsibleName(item.responsible?.userId), // Ajuste conforme seu DTO exato
          deadline: item.clientDeadline as unknown as string,
          status: item.itemStatus,
          price: item.price,
        });
      });
    });
    // Ordena por prazo (opcional, mas bom para operacional)
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
  getClientName(clientId: string | undefined): string {
    if (!clientId) return '—';
    return this.clientsList.find((c) => c.id === clientId)?.name || '—';
  }

  getFunctionalityName(funcId: string | undefined): string {
    if (!funcId) return '—';
    return this.functionalitiesList.find((f) => f.id === funcId)?.name || '—';
  }

  getResponsibleName(userId: string | undefined): string {
    // Tenta achar no userList ou retorna o próprio ID formatado se não achar
    if (!userId) return '—';
    const user = this.usersList.find((u) => u.id === userId);
    return user?.name || 'Externo';
  }

  // Tradução de Status (Simplificada)
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

  // Gera cor consistente baseada no nome
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

    // Hash simples do nome para escolher cor
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
