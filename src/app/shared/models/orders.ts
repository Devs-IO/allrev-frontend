// Shared types and interfaces for Orders domain (frontend <-> backend contract)

export type PaymentMethod = 'pix' | 'transfer' | 'deposit' | 'card' | 'other';
export type PaymentTerms = 'ONE' | 'TWO' | 'THREE';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type ItemStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT'
  | 'AWAITING_ADVISOR'
  | 'OVERDUE'
  | 'FINISHED'
  | 'DELIVERED'
  | 'CANCELED';

export interface OrderInstallment {
  id: string;
  orderId?: string;
  sequence: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paidAt?: string; // ISO
  channel?: PaymentMethod | string;
}

export interface ResponsibilityUser {
  userId: string;
  name?: string;
  email?: string;
}

export interface OrderItemResponsibility {
  id?: string;
  orderItemId?: string;
  userId: string;
  assistantDeadline?: string; // YYYY-MM-DD
  amount?: number; // collaborator amount
  paidAt?: string; // ISO
  delivered?: boolean;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  functionalityId: string;
  functionalityName?: string;
  clientId: string;
  price: number;
  paymentMethod?: string; // keep string for flexibility
  clientDeadline: string; // YYYY-MM-DD
  status: ItemStatus | string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  assistantDeadline?: string; // YYYY-MM-DD
  amountForAssistant?: number;
  serviceStartDate?: string; // YYYY-MM-DD
  serviceEndDate?: string; // YYYY-MM-DD
  userStatus?: ItemStatus | string;
  userDescription?: string;
  createdAt: string; // ISO
}

export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  tenantId: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  contractDate: string; // YYYY-MM-DD
  description?: string;
  amountTotal: number;
  amountPaid: number;
  paymentTerms: PaymentTerms;
  paymentStatus: PaymentStatus;
  workStatus: ItemStatus | string;
  items: OrderItem[];
  installments: OrderInstallment[];
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export interface CreateOrderItemDto {
  functionalityId: string;
  clientId?: string; // inherited from order if omitted
  price: number; // total item price
  paymentMethod?: string;
  clientDeadline: string; // YYYY-MM-DD
  description?: string;
  responsibleUserId?: string;
  assistantDeadline?: string; // YYYY-MM-DD
  amountForAssistant?: number;
  serviceStartDate?: string; // YYYY-MM-DD
  serviceEndDate?: string; // YYYY-MM-DD
  userStatus?: ItemStatus | string;
  userDescription?: string;
}

export interface CreateOrderDto {
  clientId: string;
  contractDate: string; // YYYY-MM-DD
  description?: string;
  paymentTerms?: PaymentTerms; // default set by backend if omitted
  items: CreateOrderItemDto[];
}
