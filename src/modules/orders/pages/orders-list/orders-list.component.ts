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
// CORREÇÃO: Importamos 'OrderItemResponsibility' (nome correto)
import { OrderResponseDto as IOrder } from '../../interfaces/order.interface';

// Imports para os novos filtros
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interface';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
// CORREÇÃO: Importamos 'FunctionalityDto' (nome correto)
import { FunctionalityDto } from '../../../functionalities/interfaces/functionalities.interface'; // <-- Nome corrigido
import { UsersService } from '../../../users/services/users.service';
// CORREÇÃO: Importamos 'ResponseUserDto' (tipo correto retornado pelo service)
import { ResponseUserDto } from '../../../users/types/user.dto'; // <-- Tipo corrigido

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

// Interface de Paginação removida (API não suporta)

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
})
export class OrdersListComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  orders$ = new BehaviorSubject<IOrder[]>([]);
  isLoading$ = new BehaviorSubject<boolean>(false);

  // Observables para os filtros
  clients$!: Observable<Client[]>;
  // CORREÇÃO: Tipo 'Functionality' alterado para 'FunctionalityDto'
  functionalities$!: Observable<FunctionalityDto[]>;
  // CORREÇÃO: Tipo 'User' alterado para 'ResponseUserDto'
  users$!: Observable<ResponseUserDto[]>;
  // Lista local de clientes para fallback de exibição de nome
  private clientsList: Client[] = [];

  // Mapeamentos para os selects de status
  paymentStatusOptions = Object.entries(PaymentStatus).map(([key, value]) => ({
    key,
    value,
  }));
  workStatusOptions = Object.entries(WorkStatus).map(([key, value]) => ({
    key,
    value,
  }));

  // Variáveis de Paginação removidas
  // totalOrders, pageSize, currentPage

  private destroy$ = new Subject<void>();
  private filters$ = new BehaviorSubject<IListOrdersFilter>({});

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
    this.loadClients();
    this.loadFunctionalities();
    this.loadUsers();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  private loadClients(): void {
    this.clients$ = this.clientsService
      .getClients()
      .pipe(tap((clients) => (this.clientsList = clients)));
  }

  private loadFunctionalities(): void {
    // Usa o método existente no service
    this.functionalities$ = this.functionalitiesService.getAll();
  }

  private loadUsers(): void {
    // CORREÇÃO: O 'getUsers()' já retorna o tipo correto (ResponseUserDto[])
    this.users$ = this.usersService.getUsers();
  }

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
            // ...currentFilters, // Removido (sem paginação)
            ...formValues,
            clientId: formValues.clientId || undefined,
            functionalityId: formValues.functionalityId || undefined,
            responsibleId: formValues.responsibleId || undefined,
            paymentStatus: formValues.paymentStatus || undefined,
            workStatus: formValues.workStatus || undefined,
            from: formValues.from || undefined,
            to: formValues.to || undefined,
            // 'page' e 'pageSize' removidos
          };

          // CORREÇÃO: A API retorna 'IOrder[]' diretamente, não um objeto paginado
          return this.ordersService.getAllOrders(combinedFilters) as Observable<
            IOrder[]
          >;
        }),
        tap((orders) => {
          // CORREÇÃO: Recebemos 'orders' (um array) diretamente
          this.orders$.next(orders);
          // (Podes guardar a contagem da página atual se quiseres)
          // this.totalOrders = orders.length;
          this.isLoading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
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

  // Navegação
  viewDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  goToCreateOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  // A função 'handlePageEvent' foi removida (sem paginação)

  // --- FUNÇÕES HELPER PARA O TEMPLATE ---

  // Fallback para obter o nome do cliente quando não vier no DTO
  getClientName(clientId: string): string {
    if (!clientId) return 'N/A';
    const found = this.clientsList.find((c) => c.id === clientId);
    return found?.name || 'N/A';
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
