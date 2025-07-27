import { Component, OnInit } from '@angular/core';
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
import { FunctionalityDto } from '../../interfaces/functionalities.interface';
import { Client } from '../../../clients/interfaces/client.interface';
import { UserProfile } from '../../../users/interfaces/user-profile.interface';

interface ServiceOrderFormItem {
  functionalityId: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  hasResponsible: boolean;
  responsibleUserId?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  description?: string;
}

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class OrderCreateComponent implements OnInit {
  formData: {
    clientId: string;
    services: ServiceOrderFormItem[];
    description: string;
  } = {
    clientId: '',
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

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private router: Router
  ) {}

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
      clientDeadline: '',
      hasResponsible: false,
      responsibleUserId: '',
      assistantDeadline: '',
      assistantAmount: 0,
      description: '',
    };
  }

  private loadInitialData() {
    this.isLoading = true;
    this.error = null;

    // Debug: verificar token
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? 'Present' : 'Not found');

    // Load all required data in parallel, including current user
    Promise.all([
      this.clientsService.getClients().toPromise(),
      this.functionalitiesService.getAll().toPromise(),
      this.functionalitiesService.getAssistantUsers().toPromise(),
      this.loadCurrentUser(),
    ])
      .then(([clients, functionalities, assistants, currentUser]) => {
        console.log('Data loaded successfully:', {
          clients,
          functionalities,
          assistants,
          currentUser,
        });
        this.clients = clients || [];
        this.functionalities = functionalities || [];
        this.assistants = assistants || [];
        this.currentUser = currentUser;
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error loading initial data:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);

        if (error.status === 401) {
          this.error = 'Erro de autenticação. Faça login novamente.';
        } else {
          this.error = 'Erro ao carregar dados. Tente novamente.';
        }
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

  onResponsibleToggle(index: number) {
    const service = this.formData.services[index];
    if (!service.hasResponsible) {
      service.responsibleUserId = '';
      service.assistantDeadline = '';
      service.assistantAmount = 0;
    }
  }

  onFunctionalityChange(index: number) {
    const service = this.formData.services[index];
    const functionality = this.functionalities.find(
      (f) => f.id === service.functionalityId
    );

    if (functionality) {
      // Set minimum price as default
      if (service.totalPrice === 0) {
        service.totalPrice = functionality.minimumPrice;
      }

      // Set default assistant price if available
      if (
        functionality.defaultAssistantPrice &&
        service.assistantAmount === 0
      ) {
        service.assistantAmount = functionality.defaultAssistantPrice;
      }
    }
  }

  validateForm(): boolean {
    this.error = null;

    // Validate client
    if (!this.formData.clientId) {
      this.error = 'Cliente é obrigatório.';
      return false;
    }

    // Validate services
    if (this.formData.services.length === 0) {
      this.error = 'Pelo menos um serviço deve ser informado.';
      return false;
    }

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

      // Validate assistant fields if responsible is assigned
      if (service.hasResponsible) {
        if (!service.responsibleUserId) {
          this.error = `Serviço ${
            i + 1
          }: Responsável é obrigatório quando atribuído.`;
          return false;
        }

        if (!service.assistantDeadline) {
          this.error = `Serviço ${i + 1}: Prazo do responsável é obrigatório.`;
          return false;
        }

        // Validate and convert assistantAmount to number
        const assistantAmount = Number(service.assistantAmount);
        if (
          !assistantAmount ||
          assistantAmount <= 0 ||
          isNaN(assistantAmount)
        ) {
          this.error = `Serviço ${
            i + 1
          }: Valor a pagar ao responsável deve ser um número maior que 0.`;
          return false;
        }
        // Update the service with the converted number
        service.assistantAmount = assistantAmount;

        // Validate that assistant deadline is before or equal to client deadline
        const assistantDate = new Date(service.assistantDeadline);
        const clientDate = new Date(service.clientDeadline);

        if (assistantDate > clientDate) {
          this.error = `Serviço ${
            i + 1
          }: Prazo do responsável deve ser anterior ou igual ao prazo de entrega.`;
          return false;
        }
      }
      // Note: Se hasResponsible = false, não validamos campos de assistant
      // pois o usuário logado será atribuído automaticamente no submit
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
    const dto: CreateServiceOrderDto = {
      clientId: this.formData.clientId,
      description: this.formData.description,
      services: this.formData.services.map((service, index) => {
        const serviceItem: ServiceOrderItemDto = {
          functionalityId: service.functionalityId,
          totalPrice: Number(service.totalPrice), // Garantir que seja number
          paymentMethod: service.paymentMethod,
          clientDeadline: service.clientDeadline,
          description: service.description,
        };

        // Lógica de atribuição: se não tem responsável específico, atribuir ao usuário logado
        const shouldAssignCurrentUser =
          !service.hasResponsible || !service.responsibleUserId;

        console.log(`Serviço ${index + 1}:`, {
          hasResponsible: service.hasResponsible,
          responsibleUserId: service.responsibleUserId,
          shouldAssignCurrentUser,
          currentUserId: this.currentUser?.id,
        });

        if (shouldAssignCurrentUser) {
          console.log(
            `Atribuindo serviço ${index + 1} ao usuário logado:`,
            this.currentUser!.id
          );
          serviceItem.responsibleUserId = this.currentUser!.id;

          // Calcular data do assistant: 1 dia antes da data do cliente
          const clientDate = new Date(service.clientDeadline);
          const assistantDate = new Date(clientDate);
          assistantDate.setDate(assistantDate.getDate() - 1);

          // Verificar se a data calculada não é no passado
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day

          if (assistantDate < today) {
            // Se 1 dia antes for no passado, usar a data de hoje
            serviceItem.assistantDeadline = today.toISOString().split('T')[0];
            console.log(
              `Data ajustada para hoje pois 1 dia antes seria no passado`
            );
          } else {
            serviceItem.assistantDeadline = assistantDate
              .toISOString()
              .split('T')[0];
          }

          serviceItem.assistantAmount = Number(service.totalPrice); // Usar o valor total como receita do responsável

          console.log(
            `Prazo do cliente: ${service.clientDeadline}, Prazo do responsável: ${serviceItem.assistantDeadline}`
          );
        } else {
          console.log(
            `Usando responsável específico para serviço ${index + 1}:`,
            service.responsibleUserId
          );
          serviceItem.responsibleUserId = service.responsibleUserId;
          serviceItem.assistantDeadline = service.assistantDeadline;
          serviceItem.assistantAmount = Number(service.assistantAmount); // Garantir que seja number
        }

        return serviceItem;
      }),
    };

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

        if (error.status === 401) {
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

  // Get today's date in YYYY-MM-DD format for min date validation
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
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
      // Só calcular custo se tem responsável específico atribuído
      if (service.hasResponsible && service.assistantAmount) {
        return sum + (Number(service.assistantAmount) || 0);
      }
      // Se não tem responsável específico, não há custo de assistente
      return sum;
    }, 0);
  }

  toNumber(value: any): number {
    return Number(value);
  }

  // Get count of services with specific responsible
  getSpecificAssignmentsCount(): number {
    if (!this.formData?.services) {
      return 0;
    }
    return this.formData.services.filter((service) => service.hasResponsible)
      .length;
  }

  // Get count of services with automatic assignment (current user)
  getAutomaticAssignmentsCount(): number {
    if (!this.formData?.services) {
      return 0;
    }
    return this.formData.services.filter((service) => !service.hasResponsible)
      .length;
  }

  // Calculate profit (revenue - costs)
  getEstimatedProfit(): number {
    return (this.getTotalValue() || 0) - (this.getTotalAssistantCosts() || 0);
  }

  // Calculate estimated revenue from services without specific assignment (automatic assignment)
  getEstimatedRevenue(): number {
    if (!this.formData?.services) {
      return 0;
    }
    return this.formData.services.reduce((sum, service) => {
      // Se não tem responsável específico, o valor total vira receita estimada
      if (!service.hasResponsible) {
        return sum + (Number(service.totalPrice) || 0);
      }
      return sum;
    }, 0);
  }
}
