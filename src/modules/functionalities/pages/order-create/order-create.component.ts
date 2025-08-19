import { Component, OnInit } from '@angular/core';
import { BrDatepickerDirective } from '../../../../app/core/directives/br-datepicker.directive';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { AuthService } from '../../../../app/core/services/auth.service';
import {
  CreateServiceOrderDto,
  ServiceOrderItemDto,
  AssistantUser,
} from '../../interfaces/service-order.interface';
import {
  FunctionalitiesClientsStatus,
  FunctionalitiesUsersStatus,
  FunctionalitiesClientsStatusLabels,
  FunctionalitiesUsersStatusLabels,
} from '../../interfaces/status.enums';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';
import { Client } from '../../../clients/interfaces/client.interface';
import { UserProfile } from '../../../users/interfaces/user-profile.interface';

interface ServiceOrderFormItem {
  functionalityId: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  status: FunctionalitiesClientsStatus;
  responsibleUserId?: string;
  // Single responsible available for this functionality (fetched on selection)
  responsibleOptions?: AssistantUser[]; // kept for compatibility, but will contain a single option
  responsibleLocked?: boolean; // UI: disable select when single responsible enforced
  assistantDeadline?: string;
  assistantAmount?: number;
  serviceStartDate?: string;
  serviceEndDate?: string;
  userStatus?: FunctionalitiesUsersStatus;
  price?: number;
  description?: string;
  userDescription?: string; // explicit description for the responsible
}

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrDatepickerDirective,
  ],
})
export class OrderCreateComponent implements OnInit {
  // Per-page cache: Map<entityKey, Map<tenantId, { data, expiresAt }>>
  private cache = new Map<
    string,
    Map<string, { data: any[]; expiresAt: number }>
  >();
  formData: {
    clientId: string;
    contractDate: string; // BR format dd/MM/yyyy
    services: ServiceOrderFormItem[];
    description: string;
  } = {
    clientId: '',
    contractDate: '',
    services: [this.createEmptyServiceItem()],
    description: '',
  };

  // Data for selects
  clients: Client[] = [];
  functionalities: FunctionalityDto[] = [];
  assistants: AssistantUser[] = [];

  // State
  error: string | null = null;
  isLoading = false;
  isSubmitting = false;
  currentUser: UserProfile | null = null;

  // Payment methods
  paymentMethods = [
    'Pix',
    'Boleto',
    'Cartão de Crédito',
    'Cartão de Débito',
    'Transferência Bancária',
    'Dinheiro',
  ];

  // Status options (clients side)
  clientStatusOptions = [
    FunctionalitiesClientsStatus.PENDING_PAYMENT,
    FunctionalitiesClientsStatus.PAID,
    FunctionalitiesClientsStatus.OVERDUE,
    FunctionalitiesClientsStatus.CANCELED,
  ];

  userStatusOptions = [
    FunctionalitiesUsersStatus.ASSIGNED,
    FunctionalitiesUsersStatus.IN_PROGRESS,
    FunctionalitiesUsersStatus.AWAITING_CLIENT,
    FunctionalitiesUsersStatus.AWAITING_ADVISOR,
    FunctionalitiesUsersStatus.COMPLETED,
    FunctionalitiesUsersStatus.DELIVERED,
    FunctionalitiesUsersStatus.CANCELED,
  ];

  // Labels maps
  clientsStatusLabels = FunctionalitiesClientsStatusLabels;
  usersStatusLabels = FunctionalitiesUsersStatusLabels;

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private router: Router
  ) {}

  private getTenantId(): string {
    return this.currentUser?.tenant?.id ?? '';
  }

  private getTTLms(): number {
    return 7 * 60 * 1000; // 7 minutes
  }

  private getCache(entityKey: string, tenantId: string): any[] | null {
    const byTenant = this.cache.get(entityKey);
    if (!byTenant) return null;
    const entry = byTenant.get(tenantId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      byTenant.delete(tenantId);
      return null;
    }
    return entry.data;
  }

  private setCache(entityKey: string, tenantId: string, data: any[]) {
    const byTenant = this.cache.get(entityKey) ?? new Map();
    byTenant.set(tenantId, { data, expiresAt: Date.now() + this.getTTLms() });
    this.cache.set(entityKey, byTenant);
  }

  private invalidateCache(entityKey: string, tenantId?: string) {
    if (!this.cache.has(entityKey)) return;
    if (tenantId) {
      this.cache.get(entityKey)!.delete(tenantId);
    } else {
      this.cache.delete(entityKey);
    }
  }

  private loadCurrentUser(): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
      this.authService.getUserProfile().subscribe({
        next: (user: UserProfile) => {
          console.log('Current user loaded from API:', user);
          console.log('User ID:', user.id);
          console.log('User name:', user.name);
          console.log('User role:', user.role);
          this.currentUser = user;
          resolve(user);
        },
        error: (error) => {
          console.error('Error loading current user:', error);
          reject(error);
        },
      });
    });
  }

  ngOnInit() {
    this.testAuthentication();
    this.loadInitialData();
  }

  // Método para testar a autenticação
  private testAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('=== AUTH DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);

    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }

    if (user) {
      try {
        const userObj = JSON.parse(user);
        console.log('User from localStorage (only email):', userObj);
        console.log('Note: Full user data will be loaded from /me endpoint');
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    console.log('==================');
  }

  private createEmptyServiceItem(): ServiceOrderFormItem {
    return {
      functionalityId: '',
      totalPrice: 0,
      paymentMethod: 'Pix',
      clientDeadline: '', // BR dd/MM/yyyy
      status: FunctionalitiesClientsStatus.PENDING_PAYMENT,
      responsibleUserId: '',
      assistantDeadline: '', // BR dd/MM/yyyy (legacy)
      assistantAmount: 0,
      userStatus: FunctionalitiesUsersStatus.ASSIGNED,
      price: 0,
      description: '',
      userDescription: '',
    };
  }

  private loadInitialData() {
    this.isLoading = true;
    this.error = null;

    // Ensure we know the tenant for cache keys
    this.loadCurrentUser()
      .then(() => {
        const tenantId = this.getTenantId();

        // Try cache first
        const cachedClients = this.getCache('clients', tenantId) as
          | Client[]
          | null;
        const cachedFuncs = this.getCache('functionalities', tenantId) as
          | FunctionalityDto[]
          | null;
        const cachedAssistants = this.getCache('assistants', tenantId) as
          | AssistantUser[]
          | null;

        if (cachedClients) this.clients = cachedClients;
        if (cachedFuncs) this.functionalities = cachedFuncs;
        if (cachedAssistants) this.assistants = cachedAssistants;

        const allCached = !!(cachedClients && cachedFuncs && cachedAssistants);
        if (allCached) {
          this.isLoading = false;
          this.formData.contractDate = this.getTodayDateBR();
        }

        // Background refresh: clients
        this.clientsService.getClients().subscribe({
          next: (clients) => {
            this.clients = clients || [];
            this.setCache('clients', tenantId, this.clients);
          },
          error: (error) => {
            console.error('Erro ao carregar clientes:', error);
            if (!allCached) this.error = 'Erro ao carregar clientes.';
          },
          complete: () => {
            // no-op
          },
        });
        // Background refresh: functionalities
        this.functionalitiesService.getAll().subscribe({
          next: (funcs) => {
            this.functionalities = funcs || [];
            this.setCache('functionalities', tenantId, this.functionalities);
          },
          error: (error) => {
            console.error('Erro ao carregar serviços:', error);
            if (!allCached) this.error = 'Erro ao carregar serviços.';
          },
        });
        // Background refresh: assistants/collaborators
        this.functionalitiesService.getAssistantUsers().subscribe({
          next: (assistants) => {
            this.assistants = assistants || [];
            this.setCache('assistants', tenantId, this.assistants);
          },
          error: (error) => {
            console.error('Erro ao carregar responsáveis:', error);
            if (!allCached) this.error = 'Erro ao carregar responsáveis.';
          },
          complete: () => {
            this.isLoading = false;
            this.formData.contractDate = this.getTodayDateBR();
          },
        });
      })
      .catch((error) => {
        console.error('Error loading current user:', error);
        this.error = 'Erro de autenticação. Faça login novamente.';
        this.isLoading = false;
      });
  }

  addService() {
    this.formData.services.push(this.createEmptyServiceItem());
  }

  removeService(index: number) {
    if (this.formData.services.length > 1) {
      this.formData.services.splice(index, 1);
    }
  }

  // When total price changes, if current user is the responsible, sync price to total
  onTotalPriceChange(index: number) {
    const service = this.formData.services[index];
    service.totalPrice = Number(service.totalPrice);
    this.syncPriceIfCurrentUser(index);
  }

  private syncPriceIfCurrentUser(index: number) {
    const service = this.formData.services[index];
    if (
      service.responsibleUserId &&
      this.currentUser &&
      service.responsibleUserId === this.currentUser.id
    ) {
      service.price = Number(service.totalPrice) || 0;
      service.assistantAmount = Number(service.totalPrice) || 0;
    }
  }

  onFunctionalityChange(index: number) {
    const service = this.formData.services[index];
    const functionality = this.functionalities.find(
      (f) => f.id === service.functionalityId
    );

    if (functionality) {
      // Always set total price to the functionality minimum when service changes
      service.totalPrice = functionality.minimumPrice;

      // Set default assistant price initially (may be overridden if responsible is current user)
      if (
        functionality.defaultAssistantPrice !== undefined &&
        functionality.defaultAssistantPrice !== null
      ) {
        service.assistantAmount = functionality.defaultAssistantPrice;
        service.price = functionality.defaultAssistantPrice;
      } else {
        service.assistantAmount = 0;
        service.price = 0;
      }
    }

    // Reset and load single responsible; disable select
    service.responsibleLocked = false;
    service.responsibleUserId = '';
    service.responsibleOptions = [];
    if (service.functionalityId) {
      this.functionalitiesService
        .getFunctionalityResponsible(service.functionalityId)
        .subscribe({
          next: (resp) => {
            if (resp && resp.userId) {
              service.responsibleOptions = [
                { id: resp.userId, name: resp.name } as AssistantUser,
              ];
              service.responsibleUserId = resp.userId;
              service.responsibleLocked = true;
              // Ensure pricing reflects responsible assignment
              this.applyPricingDefaults(index);
            } else {
              service.responsibleOptions = [];
              service.responsibleLocked = false;
            }
          },
          error: (err) => {
            console.error('Erro ao buscar responsável do serviço:', err);
            service.responsibleOptions = [];
            service.responsibleLocked = false;
          },
        });
    }
  }

  private applyPricingDefaults(index: number) {
    const service = this.formData.services[index];
    const functionality = this.functionalities.find(
      (f) => f.id === service.functionalityId
    );
    if (!functionality) return;

    if (
      this.currentUser &&
      service.responsibleUserId &&
      service.responsibleUserId === this.currentUser.id
    ) {
      // Logged-in user is responsible: collaborator amount equals total
      const total = Number(service.totalPrice) || 0;
      service.price = total;
      service.assistantAmount = total;
    } else {
      // Another user is responsible: use default assistant price if available
      if (
        functionality.defaultAssistantPrice !== undefined &&
        functionality.defaultAssistantPrice !== null
      ) {
        service.price = functionality.defaultAssistantPrice;
        service.assistantAmount = functionality.defaultAssistantPrice;
      }
      // else keep whatever is currently set (likely 0, forcing user to input)
    }
  }

  // helper: focus first service functionality select for quick correction
  private focusFunctionalitySelect(index: number) {
    setTimeout(() => {
      const el = document.querySelector(
        `select[name="functionalityId_${index}"]`
      ) as HTMLSelectElement | null;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  // Auto-fill End Date as Start + 3 days when Start is provided and End is empty
  onServiceStartChange(index: number) {
    const service = this.formData.services[index];
    if (service.serviceStartDate && !service.serviceEndDate) {
      const start = this.parseBRDate(service.serviceStartDate);
      if (start) {
        const end = new Date(start);
        end.setDate(end.getDate() + 3);
        service.serviceEndDate = this.formatDateToBR(end);
      }
    }
  }
  validateForm(): boolean {
    for (let i = 0; i < this.formData.services.length; i++) {
      const service = this.formData.services[i];

      if (!service.functionalityId) {
        this.error = `Serviço ${i + 1}: Funcionalidade é obrigatória.`;
        return false;
      }

      // Validate and convert totalPrice to number
      const totalPrice = Number(service.totalPrice);
      if (!totalPrice || totalPrice <= 0 || isNaN(totalPrice)) {
        this.error = `Serviço ${i + 1}: Valor deve ser um número maior que 0.`;
        return false;
      }
      // Update the service with the converted number
      service.totalPrice = totalPrice;

      if (!service.paymentMethod) {
        this.error = `Serviço ${i + 1}: Método de pagamento é obrigatório.`;
        return false;
      }

      if (!service.clientDeadline) {
        this.error = `Serviço ${i + 1}: Prazo de entrega é obrigatório.`;
        return false;
      }
      if (!this.parseBRDate(service.clientDeadline)) {
        this.error = `Serviço ${
          i + 1
        }: Prazo de entrega inválido. Use o formato dd/mm/aaaa.`;
        return false;
      }

      if (!service.status) {
        this.error = `Serviço ${i + 1}: Status é obrigatório.`;
        return false;
      }

      // Responsible is mandatory
      if (!service.responsibleUserId) {
        this.error = `Serviço ${i + 1}: Responsável é obrigatório.`;
        return false;
      }

      // If responsible is current user, force amount to total
      if (
        this.currentUser &&
        service.responsibleUserId === this.currentUser.id
      ) {
        service.price = Number(service.totalPrice);
        service.assistantAmount = Number(service.totalPrice);
      }

      if (!service.serviceStartDate) {
        this.error = `Serviço ${
          i + 1
        }: Data de início do colaborador é obrigatória.`;
        return false;
      }
      if (!this.parseBRDate(service.serviceStartDate)) {
        this.error = `Serviço ${
          i + 1
        }: Data de início inválida. Use dd/mm/aaaa.`;
        return false;
      }
      if (!service.serviceEndDate) {
        // Attempt auto-fill
        this.onServiceStartChange(i);
      }
      if (!service.serviceEndDate) {
        this.error = `Serviço ${
          i + 1
        }: Data de término do colaborador é obrigatória.`;
        return false;
      }
      if (!this.parseBRDate(service.serviceEndDate)) {
        this.error = `Serviço ${
          i + 1
        }: Data de término inválida. Use dd/mm/aaaa.`;
        return false;
      }

      if (!service.userStatus) {
        this.error = `Serviço ${i + 1}: Status do responsável é obrigatório.`;
        return false;
      }
      // Validate and convert price to number
      const assistantAmount = Number(service.price ?? service.assistantAmount);
      if (!assistantAmount || assistantAmount <= 0 || isNaN(assistantAmount)) {
        this.error = `Serviço ${
          i + 1
        }: Valor a pagar ao responsável deve ser um número maior que 0.`;
        return false;
      }
      // Update values
      service.price = assistantAmount;
      service.assistantAmount = assistantAmount;

      // Ensure selection equals the single allowed responsible
      const allowedIds = (service.responsibleOptions || []).map((a) => a.id);
      if (
        allowedIds.length !== 1 ||
        service.responsibleUserId !== allowedIds[0]
      ) {
        this.error = `Serviço ${
          i + 1
        }: Responsável inválido para esta funcionalidade. Escolha um da lista.`;
        return false;
      }
      // Validate dates coherence
      const startDate = this.parseBRDate(service.serviceStartDate)!;
      const endDate = this.parseBRDate(service.serviceEndDate)!;
      const clientDate = this.parseBRDate(service.clientDeadline)!;
      if (endDate < startDate) {
        this.error = `Serviço ${i + 1}: Término deve ser após o início.`;
        return false;
      }
      if (endDate > clientDate) {
        this.error = `Serviço ${
          i + 1
        }: Término deve ser anterior ou igual ao prazo do cliente.`;
        return false;
      }

      // Client date must not be in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (clientDate < today) {
        this.error = `Serviço ${
          i + 1
        }: Prazo do cliente não pode ser no passado.`;
        return false;
      }
    }

    return true;
  }

  submit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    // Debug: verificar token antes do envio
    const token = localStorage.getItem('token');
    console.log('Token before submit:', !!token);

    // Verificar se o usuário atual foi carregado
    if (!this.currentUser || !this.currentUser.id) {
      console.error('Current user is not loaded:', this.currentUser);
      this.error = 'Erro: usuário não encontrado. Faça login novamente.';
      this.isSubmitting = false;
      return;
    }

    console.log('Current user ID:', this.currentUser.id);
    console.log('Current user name:', this.currentUser.name);

    // Transform form data to DTO
    const contractISO =
      this.parseBRToISO(this.formData.contractDate) ||
      this.parseBRToISO(this.getTodayDateBR())!;
    const dto: CreateServiceOrderDto = {
      clientId: this.formData.clientId,
      contractDate: contractISO,
      description: this.formData.description,
      services: this.formData.services.map((service, index) => {
        const serviceItem: ServiceOrderItemDto = {
          functionalityId: service.functionalityId,
          totalPrice: Number(service.totalPrice),
          paymentMethod: service.paymentMethod,
          clientDeadline: this.parseBRToISO(service.clientDeadline)!,
          status: service.status,
          description: service.description,
          userDescription: service.userDescription,
        };
        // Ensure selected responsible is within allowed options
        const allowedIds = (service.responsibleOptions || []).map((a) => a.id);
        if (
          !service.responsibleUserId ||
          allowedIds.length !== 1 ||
          service.responsibleUserId !== allowedIds[0]
        ) {
          throw new Error(
            'Responsável selecionado é inválido para este serviço.'
          );
        }
        serviceItem.responsibleUserId = service.responsibleUserId;
        serviceItem.serviceStartDate = this.parseBRToISO(
          service.serviceStartDate!
        )!;
        serviceItem.serviceEndDate = this.parseBRToISO(
          service.serviceEndDate!
        )!;
        if (service.assistantDeadline) {
          serviceItem.assistantDeadline = this.parseBRToISO(
            service.assistantDeadline
          )!; // legacy
        }
        serviceItem.userStatus = service.userStatus;
        const computedPrice =
          this.currentUser && service.responsibleUserId === this.currentUser.id
            ? Number(service.totalPrice)
            : Number(service.price ?? service.assistantAmount);
        serviceItem.price = computedPrice;
        serviceItem.assistantAmount = computedPrice;
        return serviceItem;
      }),
    };

    // Sanitização extra: remover assistantDeadline vazia caso tenha escapado
    dto.services = dto.services.map((s) => {
      if ((s as any).assistantDeadline === '') {
        delete (s as any).assistantDeadline;
      }
      return s;
    });

    console.log('DTO to send:', dto);
    console.log('DTO types check:', {
      totalPrice: typeof dto.services[0]?.totalPrice,
      assistantAmount: typeof dto.services[0]?.assistantAmount,
      sampleTotalPrice: dto.services[0]?.totalPrice,
      sampleAssistantAmount: dto.services[0]?.assistantAmount,
    });

    this.functionalitiesService.createServiceOrder(dto).subscribe({
      next: (response) => {
        console.log('Service order created:', response);
        // Show success message and redirect
        alert('Ordem de serviço criada com sucesso!');
        this.router.navigate(['/order/list']);
      },
      error: (error) => {
        console.error('Error creating service order:', error);
        console.error('Error status:', error.status);
        console.error('Error headers:', error.headers);

        const msg: string = error?.error?.message || '';
        if (
          error.status === 400 &&
          msg.includes('Responsável não habilitado')
        ) {
          this.formData.services.forEach((service) => {
            service.responsibleUserId = '';
          });
          alert(
            'Responsável não habilitado para este serviço. Escolha um responsável válido da lista.'
          );
          this.error =
            'Responsável não habilitado para este serviço. Escolha um responsável válido da lista.';
          const idx = Math.max(
            0,
            this.formData.services.findIndex((s) => !!s)
          );
          this.focusFunctionalitySelect(idx === -1 ? 0 : idx);
        } else if (
          error.status === 400 &&
          msg === 'responsible.invalid_for_service'
        ) {
          alert(
            'Responsável inválido para este serviço. Selecione o responsável indicado.'
          );
          this.error =
            'Responsável inválido para este serviço. Selecione o responsável indicado.';
          const idx = Math.max(
            0,
            this.formData.services.findIndex((s) => !!s)
          );
          this.focusFunctionalitySelect(idx === -1 ? 0 : idx);
        } else if (error.status === 401) {
          this.error = 'Erro de autenticação. Faça login novamente.';
        } else {
          this.error =
            error.error?.message ||
            'Erro ao criar ordem de serviço. Tente novamente.';
        }
        this.isSubmitting = false;
      },
    });
  }

  cancel() {
    if (confirm('Deseja realmente cancelar? Todos os dados serão perdidos.')) {
      this.router.navigate(['/order/list']);
    }
  }

  getFunctionalityName(functionalityId: string): string {
    const functionality = this.functionalities.find(
      (f) => f.id === functionalityId
    );
    return functionality ? functionality.name : '';
  }

  getAssistantName(assistantId: string): string {
    const assistant = this.assistants.find((a) => a.id === assistantId);
    return assistant ? assistant.name : '';
  }

  getClientName(clientId: string): string {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? client.name : '';
  }

  // Date helpers (BR <-> ISO)
  getTodayDateBR(): string {
    return this.formatDateToBR(new Date());
  }

  private pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  formatDateToBR(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return `${this.pad(d.getDate())}/${this.pad(
      d.getMonth() + 1
    )}/${d.getFullYear()}`;
  }

  parseBRDate(value?: string): Date | null {
    if (!value) return null;
    const m = value.match(/^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/);
    if (!m) return null;
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    const yyyy = parseInt(m[3], 10);
    const d = new Date(yyyy, mm, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd)
      return null;
    return d;
  }

  parseBRToISO(value?: string): string | null {
    const d = this.parseBRDate(value);
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = this.pad(d.getMonth() + 1);
    const dd = this.pad(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }

  // Template helper: coerce to number
  toNumber(value: any): number {
    return Number(value);
  }

  // Calculate total value of all services
  getTotalValue(): number {
    if (!this.formData?.services) {
      return 0;
    }
    return this.formData.services.reduce(
      (sum, service) => sum + (Number(service.totalPrice) || 0),
      0
    );
  }

  // Calculate total assistant costs
  getTotalAssistantCosts(): number {
    if (!this.formData?.services) {
      return 0;
    }
    return this.formData.services.reduce((sum, service) => {
      if (service.assistantAmount) {
        return sum + (Number(service.assistantAmount) || 0);
      }
      return sum;
    }, 0);
  }

  // Calculate estimated revenue from services for current user (as responsible)
  getEstimatedRevenue(): number {
    if (!this.formData?.services || !this.currentUser) {
      return 0;
    }
    return this.formData.services.reduce((sum, service) => {
      if (service.responsibleUserId === this.currentUser!.id) {
        return sum + (Number(service.totalPrice) || 0);
      }
      return sum;
    }, 0);
  }
}
