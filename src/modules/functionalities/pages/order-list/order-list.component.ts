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
  allOrders: any[] = [];
  filteredOrders: ServiceOrderResponse[] = [];
  filteredAssignments: AssignmentResponse[] = [];
  filteredAllOrders: any[] = [];

  // State
  isLoading = false;
  error: string | null = null;
  userRole: string | null = null;
  currentView: 'orders' | 'assignments' = 'orders'; // legacy (not used for display now)
  user: any | null = null;

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
    this.authService.loadUserIfNeeded().subscribe({
      next: (user) => {
        this.user = user;
        this.userRole = user?.role;
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
    this.serviceOrders = [];
    this.myAssignments = [];
    this.allOrders = [];
    this.filteredOrders = [];
    this.filteredAssignments = [];
    this.filteredAllOrders = [];

    const isManager = this.userRole === 'manager_reviewers';
    const hasAssistantLinks =
      Array.isArray(this.user?.tenants) &&
      this.user.tenants.some((t: any) => t.role === 'assistant_reviewers');

    const loaders: Promise<void>[] = [];
    if (isManager) loaders.push(this.loadServiceOrdersPromise());
    if (hasAssistantLinks) loaders.push(this.loadMyAssignmentsPromise());

    if (loaders.length === 0) {
      this.error = 'Você não tem permissão para visualizar ordens de serviço.';
      return;
    }
    this.isLoading = true;
    Promise.all(loaders).finally(() => {
      this.buildAllOrders();
      this.applyFilters();
      this.isLoading = false;
    });
  }

  private loadServiceOrdersPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.functionalitiesService.getAllServiceOrdersList().subscribe({
        next: (orders) => {
          this.serviceOrders = orders.map((o) => ({
            ...o,
            isAssistant: false,
          }));
          this.filteredOrders = this.serviceOrders;
          resolve();
        },
        error: (error) => {
          console.error('Error loading service orders:', error);
          if (!this.error) this.error = 'Erro ao carregar ordens de serviço.';
          resolve();
        },
      });
    });
  }

  private loadMyAssignmentsPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.functionalitiesService.getMyAssignments().subscribe({
        next: (assignments) => {
          this.myAssignments = assignments.map((a) => ({
            ...a,
            isAssistant: true,
          }));
          this.filteredAssignments = this.myAssignments;
          resolve();
        },
        error: (error) => {
          console.error('Error loading assignments:', error);
          if (!this.error) this.error = 'Erro ao carregar atribuições.';
          resolve();
        },
      });
    });
  }

  private buildAllOrders() {
    // Map assignments to order-like objects
    const assignmentOrders = this.myAssignments.map((a) => ({
      orderId: 'ASSIGN-' + a.assignmentId,
      clientId: undefined,
      clientName: a.clientName,
      clientEmail: undefined,
      clientInstitution: undefined,
      deadline: a.yourDeadline,
      total: a.yourAmount,
      totalAssistantAmount: a.yourAmount,
      serviceCount: 1,
      status:
        a.status === 'IN_PROGRESS'
          ? 'IN_PROGRESS'
          : a.status === 'FINISHED'
          ? 'FINISHED'
          : 'PENDING',
      createdAt: a.yourDeadline,
      services: [
        {
          id: a.assignmentId,
          orderNumber: 'ASSIGN-' + a.assignmentId,
          orderDescription: a.serviceDescription || a.serviceName,
          functionalityId: '',
          functionalityName: a.serviceName,
          totalPrice: a.yourAmount,
          paymentMethod: '',
          clientDeadline: a.yourDeadline,
          status: 'PENDING',
          paidAt: undefined,
          responsibleUserId: '',
          responsibleUserName: '',
          assistantDeadline: a.yourDeadline,
          assistantAmount: a.yourAmount,
          delivered: a.status === 'FINISHED',
          description: a.serviceDescription,
          createdAt: a.yourDeadline,
        } as any,
      ],
      isAssistant: true,
    }));
    this.allOrders = [
      ...this.serviceOrders.map((o) => ({ ...o, isAssistant: false })),
      ...assignmentOrders,
    ];
    // Sort by createdAt desc if present
    this.allOrders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.filteredAllOrders = this.allOrders;
  }

  // Legacy individual loaders kept for backward compatibility (unused externally)
  private loadServiceOrders() {
    /* no-op replaced by Promise version */
  }
  private loadMyAssignments() {
    /* no-op replaced by Promise version */
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    const status = this.statusFilter;

    this.filteredAssignments = this.myAssignments.filter((a) => {
      const matchesSearch =
        !term ||
        a.clientName.toLowerCase().includes(term) ||
        a.serviceName.toLowerCase().includes(term);
      const matchesStatus = !status || a.status === status;
      return matchesSearch && matchesStatus;
    });

    this.filteredAllOrders = this.allOrders.filter((o) => {
      const matchesSearch =
        !term ||
        (o.clientName && o.clientName.toLowerCase().includes(term)) ||
        o.services?.some((s: any) =>
          s.functionalityName?.toLowerCase().includes(term)
        );
      const matchesStatus = !status || o.status === status;
      return matchesSearch && matchesStatus;
    });
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
