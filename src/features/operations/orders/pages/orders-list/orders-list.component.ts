import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  Subject,
  BehaviorSubject,
  combineLatest,
  forkJoin,
} from 'rxjs';
import {
  tap,
  debounceTime,
  switchMap,
  takeUntil,
  startWith,
  take,
} from 'rxjs/operators';

// Importa a interface de paginação do serviço
import {
  OrdersService,
  IListOrdersFilter,
  PaginatedOrders,
} from '../../services/orders.service';

// Importa a interface de Ordem (IOrder)
import {
  OrderResponseDto as IOrder,
  // OrderItemResponsibility removida (não é mais usada diretamente)
} from '../../interfaces/order.interface';

// Imports para os filtros
import { ClientsService } from '../../../clients/services/clients.service';
import { Client } from '../../../clients/interfaces/client.interface';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { FunctionalityDto } from '../../../functionalities/interfaces/functionalities.interface';
import { UsersService } from '../../../../admin/users/services/users.service';
import { ResponseUserDto } from '../../../../admin/users/types/user.dto';

// Enumerações
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

// Interface para paginação Bootstrap (simples)
interface PageEvent {
  pageIndex: number; // base 0
  pageSize: number;
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
  orders$ = new BehaviorSubject<IOrder[]>([]);
  isLoading$ = new BehaviorSubject<boolean>(false);

  // Observables para os <select> dos filtros
  clients$!: Observable<Client[]>;
  functionalities$!: Observable<FunctionalityDto[]>;
  users$!: Observable<ResponseUserDto[]>;

  // Arrays locais para tradução
  private clientsList: Client[] = [];
  private functionalitiesList: FunctionalityDto[] = [];
  private usersList: ResponseUserDto[] = [];

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
  totalOrders = 0;
  pageSize = 10;
  currentPage = 0; // base 0 (pageIndex)

  private destroy$ = new Subject<void>();
  private filtersTrigger$ = new BehaviorSubject<IListOrdersFilter>({
    page: 1, // API espera base 1
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

  // Formulário com os novos campos
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

  /**
   * Carrega os dados dos 3 filtros (Clientes, Func, Users) EM PARALELO.
   * Quando todos estiverem carregados, guarda nas listas locais e
   * inicia a subscrição principal que busca as Vendas.
   */
  private loadFilterDataAndSubscribeToOrders(): void {
    // Usa os métodos corretos dos serviços
    this.clients$ = this.clientsService.getClients();
    this.functionalities$ = this.functionalitiesService.getAll();
    this.users$ = this.usersService.getUsers(); // Nome 'getUsers' assumido

    // Usamos forkJoin para esperar que TODOS os dados dos filtros cheguem
    forkJoin({
      clients: this.clients$.pipe(take(1)),
      functionalities: this.functionalities$.pipe(take(1)),
      users: this.users$.pipe(take(1)),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ clients, functionalities, users }) => {
        // Guardamos os dados nas listas locais
        this.clientsList = clients;
        this.functionalitiesList = functionalities;
        this.usersList = users;

        // Só agora iniciamos a subscrição das VENDAS
        this.setupOrdersSubscription();
      });
  }

  /**
   * Escuta o 'filtersTrigger$'. Qualquer mudança nele (seja do formulário ou
   * da paginação) dispara uma nova busca na API.
   */
  private setupOrdersSubscription(): void {
    this.filtersTrigger$
      .pipe(
        switchMap((filters) => {
          this.isLoading$.next(true);
          // Combina os filtros do trigger (page/pageSize) com os do formulário
          const formValues = this.filterForm.value;
          const combinedFilters: IListOrdersFilter = {
            ...filters, // Contém page/pageSize
            ...formValues, // Contém os filtros do form
            clientId: formValues.clientId || undefined,
            functionalityId: formValues.functionalityId || undefined,
            responsibleId: formValues.responsibleId || undefined,
            paymentStatus: formValues.paymentStatus || undefined,
            workStatus: formValues.workStatus || undefined,
            from: formValues.from || undefined,
            to: formValues.to || undefined,
          };

          // O serviço agora retorna 'PaginatedOrders'
          return this.ordersService.getAllOrders(combinedFilters);
        }),
        tap((response: PaginatedOrders) => {
          // Extraímos 'data' e 'total' da resposta
          this.orders$.next(response.data);
          this.totalOrders = response.total;
          this.isLoading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Escuta as mudanças do FORMULÁRIO.
   * Quando o usuário muda um filtro, atualiza o 'filtersTrigger$',
   * resetando para a página 1.
   */
  private setupFormSubscription(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 0; // Reseta o índice da página (base 0)
        this.filtersTrigger$.next({
          page: 1, // API espera base 1
          pageSize: this.pageSize,
        });
      });
  }

  // Reset do formulário atualizado
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
    // O 'setupFormSubscription' já vai detetar a mudança e recarregar
  }

  // Navegação
  viewDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  goToCreateOrder(): void {
    this.router.navigate(['/orders/create']);
  }

  // Lógica de Paginação
  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;

    this.filtersTrigger$.next({
      page: this.currentPage + 1, // API espera base 1
      pageSize: this.pageSize,
    });
  }

  // --- Funções de Tradução (usadas no HTML) ---

  /**
   * Encontra o nome do Cliente baseado no ID.
   * Usa a lista 'clientsList' carregada no início.
   */
  // CORREÇÃO: Aceita 'string | undefined'
  getClientName(clientId: string | undefined): string {
    if (!clientId || this.clientsList.length === 0) return 'N/A';
    const client = this.clientsList.find((c) => c.id === clientId);
    return client?.name || 'N/A';
  }

  /**
   * Encontra o nome da Funcionalidade baseado no ID.
   * Usa a lista 'functionalitiesList' carregada no início.
   */
  // CORREÇÃO: Aceita 'string | undefined'
  getFunctionalityName(funcId: string | undefined): string {
    if (!funcId || this.functionalitiesList.length === 0) return 'N/A';
    const func = this.functionalitiesList.find((f) => f.id === funcId);
    return func?.name || 'N/A';
  }

  /**
   * Encontra o nome do Responsável.
   * 1. Encontra a Funcionalidade pelo 'funcId'.
   * 2. Pega o 'responsibleUserId' dessa funcionalidade.
   * 3. Encontra o nome do Usuário por esse 'responsibleUserId'.
   */
  // CORREÇÃO: Aceita 'string | undefined'
  getResponsibleName(funcId: string | undefined): string {
    if (
      !funcId ||
      this.functionalitiesList.length === 0 ||
      this.usersList.length === 0
    ) {
      return 'N/A';
    }
    // 1. Encontra a funcionalidade
    const func = this.functionalitiesList.find((f) => f.id === funcId);
    if (!func || !func.responsibleUserId) return 'N/A';

    // 2. Encontra o usuário
    const user = this.usersList.find((u) => u.id === func.responsibleUserId);
    return user?.name || 'N/A';
  }

  // Mapeia o status para classes de 'badge' do Bootstrap
  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
      case 'FINISHED':
      case 'COMPLETED':
        return 'text-bg-success';
      case 'PENDING':
      case 'IN_PROGRESS':
      case 'AWAITING_CLIENT':
      case 'AWAITING_ADVISOR':
      case 'PARTIALLY_PAID':
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
      COMPLETED: 'Completo',
      IN_PROGRESS: 'Em Progresso',
      OVERDUE: 'Atrasado',
      CANCELED: 'Cancelado',
      AWAITING_CLIENT: 'Aguard. Cliente',
      AWAITING_ADVISOR: 'Aguard. Revisor',
      PARTIALLY_PAID: 'Parcial. Pago',
    };
    return statusMap[status] || status;
  }
}
