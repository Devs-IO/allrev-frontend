// Frontend enums mirroring backend values

export enum FunctionalitiesClientsStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELED = 'CANCELED',
}

export enum FunctionalitiesUsersStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CLIENT = 'AWAITING_CLIENT',
  AWAITING_ADVISOR = 'AWAITING_ADVISOR',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  OVERDUE = 'OVERDUE',
}

export const FunctionalitiesClientsStatusLabels: Record<
  FunctionalitiesClientsStatus,
  string
> = {
  [FunctionalitiesClientsStatus.PENDING_PAYMENT]: 'Pendente (pagamento)',
  [FunctionalitiesClientsStatus.PAID]: 'Pago',
  [FunctionalitiesClientsStatus.OVERDUE]: 'Atrasado',
  [FunctionalitiesClientsStatus.CANCELED]: 'Cancelado',
};

export const FunctionalitiesUsersStatusLabels: Record<
  FunctionalitiesUsersStatus,
  string
> = {
  [FunctionalitiesUsersStatus.ASSIGNED]: 'Atribuído',
  [FunctionalitiesUsersStatus.IN_PROGRESS]: 'Em andamento',
  [FunctionalitiesUsersStatus.AWAITING_CLIENT]: 'Aguardando cliente',
  [FunctionalitiesUsersStatus.AWAITING_ADVISOR]: 'Aguardando orientador',
  [FunctionalitiesUsersStatus.COMPLETED]: 'Concluído',
  [FunctionalitiesUsersStatus.DELIVERED]: 'Entregue',
  [FunctionalitiesUsersStatus.CANCELED]: 'Cancelado',
  [FunctionalitiesUsersStatus.OVERDUE]: 'Atrasado',
};
