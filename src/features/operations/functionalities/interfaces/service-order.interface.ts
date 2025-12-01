import {
  FunctionalitiesClientsStatus,
  FunctionalitiesUsersStatus,
} from './status.enums';

export interface ServiceOrderItemDto {
  functionalityId: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string; // YYYY-MM-DD
  // client item status (required by backend)
  status: FunctionalitiesClientsStatus;
  // optional fields when assigning a responsible
  responsibleUserId?: string;
  assistantDeadline?: string; // YYYY-MM-DD
  assistantAmount?: number;
  serviceStartDate?: string; // YYYY-MM-DD
  serviceEndDate?: string; // YYYY-MM-DD
  // optional assignment status and price (required when responsibleUserId present)
  userStatus?: FunctionalitiesUsersStatus;
  price?: number;
  description?: string;
  userDescription?: string;
}

export interface CreateServiceOrderDto {
  clientId: string;
  // contract date (required)
  contractDate: string; // YYYY-MM-DD
  services: ServiceOrderItemDto[];
  description?: string;
  installments?: {
    amount: number;
    dueDate: string;
    channel: string;
  }[];
}

export interface ServiceOrderItemResponseDto {
  id: string;
  functionalityId: string;
  functionalityName: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  contractDate: string;
  status: FunctionalitiesClientsStatus;
  paidAt?: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  assistantPaidAt?: string;
  delivered?: boolean;
  createdAt: Date;
  serviceStartDate?: string; // YYYY-MM-DD
  serviceEndDate?: string; // YYYY-MM-DD
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
  hasOverdueCollaborators?: boolean;
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
