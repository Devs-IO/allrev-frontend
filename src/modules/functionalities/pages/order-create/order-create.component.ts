import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { ClientsService } from '../../../clients/services/clients.service';
import {
  CreateServiceOrderDto,
  ServiceOrderItemDto,
  AssistantUser,
} from '../../interfaces/service-order.interface';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';
import { Client } from '../../../clients/interfaces/client.interface';

interface ServiceOrderFormItem {
  functionalityId: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  hasResponsible: boolean;
  responsibleUserId?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
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
  } = {
    clientId: '',
    services: [this.createEmptyServiceItem()],
  };

  // Data for selects
  clients: Client[] = [];
  functionalities: FunctionalityDto[] = [];
  assistants: AssistantUser[] = [];

  // State
  error: string | null = null;
  isLoading = false;
  isSubmitting = false;

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
    private router: Router
  ) {}

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
        console.log('User role:', userObj.role);
        console.log('User ID:', userObj.id);
        console.log('Required role: MANAGER_REVIEWERS');
        console.log(
          'User has correct role:',
          userObj.role === 'manager_reviewers'
        );
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
    };
  }

  private loadInitialData() {
    this.isLoading = true;
    this.error = null;

    // Debug: verificar token
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? 'Present' : 'Not found');

    // Load all required data in parallel
    Promise.all([
      this.clientsService.getClients().toPromise(),
      this.functionalitiesService.getAll().toPromise(),
      this.functionalitiesService.getAssistantUsers().toPromise(),
    ])
      .then(([clients, functionalities, assistants]) => {
        console.log('Data loaded successfully:', {
          clients,
          functionalities,
          assistants,
        });
        this.clients = clients || [];
        this.functionalities = functionalities || [];
        this.assistants = assistants || [];
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

    // Transform form data to DTO
    const dto: CreateServiceOrderDto = {
      clientId: this.formData.clientId,
      services: this.formData.services.map((service) => {
        const serviceItem: ServiceOrderItemDto = {
          functionalityId: service.functionalityId,
          totalPrice: Number(service.totalPrice), // Garantir que seja number
          paymentMethod: service.paymentMethod,
          clientDeadline: service.clientDeadline,
        };

        if (service.hasResponsible && service.responsibleUserId) {
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
        this.router.navigate(['/functionalities']);
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
      this.router.navigate(['/functionalities']);
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
    return this.formData.services.reduce(
      (sum, service) => sum + (Number(service.assistantAmount) || 0),
      0
    );
  }

  toNumber(value: any): number {
    return Number(value);
  }
}
