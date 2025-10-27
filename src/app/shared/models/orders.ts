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
export interface OrderItemResponsible {
  userId: string;
  name?: string;
  assistantDeadline?: string | null; // YYYY-MM-DD
  amount?: number;
}

export interface OrderItem {
  id: string;
  orderId?: string;

  functionality: {
    id: string;
    name?: string;
  };

  clientId: string;
  price: number;
  paymentMethod?: string; // keep string for flexibility
  clientDeadline: string; // YYYY-MM-DD

  itemStatus: ItemStatus | string;

  responsible?: OrderItemResponsible;

  serviceStartDate?: string; // YYYY-MM-DD
  serviceEndDate?: string; // YYYY-MM-DD
  userStatus?: ItemStatus | string;
  userDescription?: string;
  createdAt: string; // ISO
}

export interface OrderResponseDto {
  id: string;
  orderNumber: string;

  clientId: string;

  client: {
    id: string;
    name?: string;
  };

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

  assistantAmount?: number;

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

  paymentMethod?: PaymentMethod | string;
}
