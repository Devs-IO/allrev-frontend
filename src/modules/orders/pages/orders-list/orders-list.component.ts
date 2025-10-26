import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import {
  tap,
  debounceTime,
  switchMap,
  takeUntil,
  startWith,
} from 'rxjs/operators';

import {
  OrdersService,
  IListOrdersFilter,
} from '../../services/orders.service';
import { OrderResponseDto as IOrder } from '../../interfaces/order.interface';
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interface';

// Enumerações locais para Status
enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}
enum WorkStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  OVERDUE = 'OVERDUE',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED',
}

// Definição mínima local para o evento de paginação
interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

// REMOVEMOS A INTERFACE 'PaginatedOrdersResponse' pois a API não a retorna.

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
})
export class OrdersListComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  clients$!: Observable<Client[]>;
  private clientsList: Client[] = []; // Para guardar clientes para 'getClientName'

  orders$ = new BehaviorSubject<IOrder[]>([]);
  isLoading$ = new BehaviorSubject<boolean>(false);

  // Mapeamentos para os selects de status
  paymentStatusOptions = Object.entries(PaymentStatus).map(([key, value]) => ({
    key,
    value,
  }));
  workStatusOptions = Object.entries(WorkStatus).map(([key, value]) => ({
    key,
    value,
  }));

  // Paginação
  totalOrders = 0; // API NÃO FORNECE. Paginação será limitada.
  pageSize = 10;
  currentPage = 0; // pageIndex (base 0)

  private destroy$ = new Subject<void>();
  private filters$ = new BehaviorSubject<IListOrdersFilter>({});

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private clientsService: ClientsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildFilterForm();
    this.loadClients();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildFilterForm(): void {
    this.filterForm = this.fb.group({
      clientId: [''],
      from: [null],
      to: [null],
      paymentStatus: [''],
      workStatus: [''],
    });
  }

  // CORREÇÃO ERRO 1 (CLIENTE):
  // Carrega os clientes e também os guarda numa lista local
  private loadClients(): void {
    this.clients$ = this.clientsService.getClients().pipe(
      tap((clients) => {
        this.clientsList = clients;
      })
    );
  }

  // Escuta mudanças nos filtros e na paginação
  private setupFilterSubscription(): void {
    combineLatest([
      this.filterForm.valueChanges.pipe(
        startWith(this.filterForm.value),
        debounceTime(400)
      ),
      this.filters$,
    ])
      .pipe(
        switchMap(([formValues, currentFilters]) => {
          this.isLoading$.next(true);

          const combinedFilters: IListOrdersFilter = {
            ...currentFilters,
            ...formValues,
            clientId: formValues.clientId || undefined,
            paymentStatus: formValues.paymentStatus || undefined,
            workStatus: formValues.workStatus || undefined,
            from: formValues.from || undefined,
            to: formValues.to || undefined,
            page: (currentFilters.page ?? 0) + 1, // API espera page 1
            pageSize: currentFilters.pageSize ?? this.pageSize,
          };

          // --- CORREÇÃO ERRO 2 (PAGINAÇÃO) ---
          // Chamamos o serviço. Ele retorna Observable<IOrder[]>
          // Removemos o 'as Observable<PaginatedOrdersResponse>'
          return this.ordersService.getAllOrders(combinedFilters);
        }),
        tap((orders: IOrder[]) => {
          // --- CORREÇÃO ERRO 2 (PAGINAÇÃO) ---
          // Recebemos 'orders' (um array) em vez de 'response'
          this.orders$.next(orders);

          // Solução paliativa para paginação:
          // A API não retorna o total. Assumimos o total como o nº que recebemos.
          // Isto vai fazer o componente de paginação parecer que só tem 1 página.
          this.totalOrders = orders.length;

          this.isLoading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // Limpa os filtros
  clearFilters(): void {
    this.filterForm.reset({
      clientId: '',
      from: null,
      to: null,
      paymentStatus: '',
      workStatus: '',
    });
  }

  // Navega para a página de detalhes
  viewDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  // Navega para a página de criação
  goToCreateOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  // Evento da paginação
  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;

    this.filters$.next({
      ...this.filters$.value,
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  // --- CORREÇÃO ERRO 1 (CLIENTE) ---
  // Função usada pelo HTML para encontrar o nome do cliente pelo ID
  getClientName(clientId: string): string {
    if (!clientId || !this.clientsList || this.clientsList.length === 0) {
      return 'N/A';
    }
    const client = this.clientsList.find((c) => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  }

  // Mapeia o status para classes de 'badge' do Bootstrap
  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
      case 'FINISHED':
        return 'text-bg-success';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'text-bg-warning';
      case 'OVERDUE':
        return 'text-bg-info';
      case 'CANCELED':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  }

  // Mapeia o status para texto traduzido
  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      FINISHED: 'Finalizado',
      IN_PROGRESS: 'Em Progresso',
      OVERDUE: 'Atrasado',
      CANCELED: 'Cancelado',
    };
    return statusMap[status] || status;
  }
}
