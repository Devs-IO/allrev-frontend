export type PaymentMethod =
  | 'pix'
  | 'transfer'
  | 'deposit'
  | 'card'
  | 'boleto'
  | 'other';
export type PaymentTerms = 'ONE' | 'TWO' | 'THREE';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type WorkStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT'
  | 'AWAITING_ADVISOR'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELED';
export type ItemStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'AWAITING_CLIENT'
  | 'AWAITING_ADVISOR'
  | 'OVERDUE'
  | 'FINISHED'
  | 'DELIVERED'
  | 'CANCELED';

export type PaymentMethodType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'OTHER';

export interface OrderInstallment {
  id: string;
  orderId?: string;
  sequence: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paidAt?: string; // ISO
  channel?: string; // string para aceitar valores do back (pix, card, etc)
  paymentMethod?: PaymentMethodType;
  paymentMethodDescription?: string;
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
  paymentMethod?: string;
  clientDeadline: string; // YYYY-MM-DD

  itemStatus: ItemStatus | string;

  responsible?: OrderItemResponsible;

  serviceStartDate?: string;
  serviceEndDate?: string;
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
  observation?: string;
  note?: string;
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

// CORRIGIDO: Removido paymentMethod daqui pois o backend não aceita no item
export interface CreateOrderItemDto {
  functionalityId: string;
  clientId?: string;
  price: number;
  // paymentMethod?: string; <-- REMOVIDO
  clientDeadline: string; // YYYY-MM-DD
  description?: string;
  responsibleUserId?: string;
  assistantDeadline?: string; // YYYY-MM-DD

  assistantAmount?: number;

  serviceStartDate?: string;
  serviceEndDate?: string;
  userStatus?: ItemStatus | string;
  userDescription?: string;
}

export interface CreateOrderDto {
  clientId: string;
  contractDate: string; // YYYY-MM-DD
  description?: string;
  paymentTerms?: PaymentTerms;
  hasInvoice?: boolean;
  items: CreateOrderItemDto[];

  // Parcelas manuais
  installments: {
    amount: number;
    dueDate: string; // YYYY-MM-DD
    channel?: string; // 'pix' | 'card' etc
    paymentMethod?: PaymentMethodType;
    paymentMethodDescription?: string;
  }[];

  // Pagamento na Raiz
  paymentMethod?: string;
}
