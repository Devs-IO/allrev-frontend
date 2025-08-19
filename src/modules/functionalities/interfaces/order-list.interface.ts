import { FunctionalitiesClientsStatus } from './status.enums';
// Interface para resposta de ordens de serviço (managers)
export interface ServiceOrderResponse {
  orderId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientInstitution?: string;
  deadline: string;
  contractDate?: string;
  total: number;
  totalAssistantAmount: number;
  serviceCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'OVERDUE';
  hasOverdueCollaborators?: boolean;
  services: ServiceOrderItem[];
  createdAt: string;
}

export interface ServiceOrderItem {
  id: string;
  functionalityId: string;
  functionalityName: string;
  totalPrice: number;
  paymentMethod: string;
  clientDeadline: string;
  contractDate?: string;
  status: FunctionalitiesClientsStatus;
  paidAt?: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  assistantDeadline?: string;
  assistantAmount?: number;
  serviceStartDate?: string;
  serviceEndDate?: string;
  userStatus?: string;
  price?: number;
  delivered?: boolean;
  createdAt: string;
}

// Interface para atribuições dos assistants
export interface AssignmentResponse {
  assignmentId: string;
  clientName: string;
  serviceName: string;
  serviceDescription?: string;
  yourAmount: number;
  yourDeadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
}
