import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { AuthService } from '../../../../app/core/services/auth.service';
import {
  ServiceOrderResponse,
  AssignmentResponse,
} from '../../interfaces/order-list.interface';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class OrderListComponent implements OnInit {
  // Data
  serviceOrders: ServiceOrderResponse[] = [];
  myAssignments: AssignmentResponse[] = [];
  filteredOrders: ServiceOrderResponse[] = [];
  filteredAssignments: AssignmentResponse[] = [];

  // State
  isLoading = false;
  error: string | null = null;
  userRole: string | null = null;
  currentView: 'orders' | 'assignments' = 'orders';

  // Filters
  searchTerm = '';
  statusFilter = '';
  expandedOrderId: string | null = null;

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.isLoading = true;
    this.authService.getUser().subscribe({
      next: (user) => {
        if (!environment.production) {
          console.log('Loaded user from API:', user);
        }
        this.userRole = user.role;

        // Para assistants, mostrar suas atribuições por padrão
        if (this.userRole === 'assistant_reviewers') {
          this.currentView = 'assignments';
        }

        this.loadData();
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error =
          'Erro ao carregar perfil do usuário. Tente fazer login novamente.';
        this.isLoading = false;
      },
    });
  }

  loadData() {
    console.log('User role:', this.userRole);

    if (this.userRole === 'manager_reviewers') {
      this.loadServiceOrders();
    } else if (this.userRole === 'assistant_reviewers') {
      this.loadMyAssignments();
    } else {
      this.error =
        'Acesso negado. Você não tem permissão para visualizar ordens de serviço.';
      this.isLoading = false;
    }
  }

  private loadServiceOrders() {
    this.isLoading = true;
    this.error = null;

    this.functionalitiesService.getAllServiceOrdersList().subscribe({
      next: (orders) => {
        console.log('Loaded service orders:', orders);
        this.serviceOrders = orders;
        this.filteredOrders = orders;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading service orders:', error);
        this.error = 'Erro ao carregar ordens de serviço. Tente novamente.';
        this.isLoading = false;
      },
    });
  }

  private loadMyAssignments() {
    this.isLoading = true;
    this.error = null;

    this.functionalitiesService.getMyAssignments().subscribe({
      next: (assignments) => {
        console.log('Loaded assignments:', assignments);
        this.myAssignments = assignments;
        this.filteredAssignments = assignments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.error = 'Erro ao carregar suas atribuições. Tente novamente.';
        this.isLoading = false;
      },
    });
  }

  // Filters and search
  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    if (this.currentView === 'orders') {
      this.filteredOrders = this.serviceOrders.filter((order) => {
        const matchesSearch =
          !this.searchTerm ||
          order.clientName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          order.services.some((s) =>
            s.functionalityName
              .toLowerCase()
              .includes(this.searchTerm.toLowerCase())
          );

        const matchesStatus =
          !this.statusFilter || order.status === this.statusFilter;

        return matchesSearch && matchesStatus;
      });
    } else {
      this.filteredAssignments = this.myAssignments.filter((assignment) => {
        const matchesSearch =
          !this.searchTerm ||
          assignment.clientName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          assignment.serviceName
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase());

        const matchesStatus =
          !this.statusFilter || assignment.status === this.statusFilter;

        return matchesSearch && matchesStatus;
      });
    }
  }

  // View management
  switchView(view: 'orders' | 'assignments') {
    this.currentView = view;
    this.expandedOrderId = null;
    this.clearFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  // Order details expansion
  toggleOrderDetails(orderId: string) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  // Navigation
  createNewOrder() {
    this.router.navigate(['/order/create']);
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge bg-warning text-dark';
      case 'IN_PROGRESS':
        return 'badge bg-info text-white';
      case 'FINISHED':
        return 'badge bg-success text-white';
      case 'OVERDUE':
        return 'badge bg-danger text-white';
      case 'PAID':
        return 'badge bg-success text-white';
      default:
        return 'badge bg-secondary text-white';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'FINISHED':
        return 'Finalizado';
      case 'OVERDUE':
        return 'Atrasado';
      case 'PAID':
        return 'Pago';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Check permissions
  canViewAllOrders(): boolean {
    return this.userRole === 'manager_reviewers';
  }

  canViewAssignments(): boolean {
    return (
      this.userRole === 'assistant_reviewers' ||
      this.userRole === 'manager_reviewers'
    );
  }
}
