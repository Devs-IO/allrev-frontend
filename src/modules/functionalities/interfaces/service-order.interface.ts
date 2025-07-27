export interface ServiceOrderItemDto {
  functionalityId: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  responsibleUserId?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  description?: string;
}

export interface CreateServiceOrderDto {
  clientId: string;
  services: ServiceOrderItemDto[];
  description?: string;
}

export interface ServiceOrderItemResponseDto {
  id: string;
  functionalityId: string;
  functionalityName: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  assistantPaidAt?: string;
  delivered?: boolean;
  createdAt: Date;
}

export interface ServiceOrderResponseDto {
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  totalAssistantAmount: number;
  serviceCount: number;
  services: ServiceOrderItemResponseDto[];
  createdAt: Date;
}

export interface ServiceOrderSummaryDto {
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  pendingOrders: number;
  paidOrders: number;
  overdueOrders: number;
  totalServices: number;
  pendingDeliveries: number;
  completedDeliveries: number;
}

export interface AssistantUser {
  id: string;
  name: string;
}
