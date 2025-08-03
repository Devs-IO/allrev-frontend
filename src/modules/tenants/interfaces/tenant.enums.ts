export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  OVERDUE = 'overdue',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PIX = 'pix',
  BOLETO = 'boleto',
  CASH = 'cash',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export const PaymentStatusLabels = {
  [PaymentStatus.PAID]: 'Pago',
  [PaymentStatus.UNPAID]: 'Não Pago',
  [PaymentStatus.OVERDUE]: 'Em Atraso',
  [PaymentStatus.PENDING]: 'Pendente',
  [PaymentStatus.CANCELLED]: 'Cancelado',
};

export const PaymentMethodLabels = {
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.BOLETO]: 'Boleto',
  [PaymentMethod.CASH]: 'Dinheiro',
};

export const PaymentFrequencyLabels = {
  [PaymentFrequency.MONTHLY]: 'Mensal',
  [PaymentFrequency.ANNUAL]: 'Anual',
};
