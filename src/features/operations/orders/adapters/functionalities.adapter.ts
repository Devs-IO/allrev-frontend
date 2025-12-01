import {
  CreateServiceOrderDto,
  ServiceOrderItemDto,
} from '../../functionalities/interfaces/service-order.interface';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderResponseDto,
} from '../../../../app/shared/models/orders';
import { ServiceOrderResponse } from '../../functionalities/interfaces/order-list.interface';
import { FunctionalitiesClientsStatus } from '../../functionalities/interfaces/status.enums';

export class FunctionalitiesOrdersAdapter {
  // --- Helpers de Tradução (UI Legacy -> Backend DTO) ---

  private static mapToBackendEnum(value: string): string {
    const map: Record<string, string> = {
      PIX: 'pix',
      Cartão: 'card',
      Dinheiro: 'deposit',
      Transferência: 'transfer',
      Cheque: 'boleto',
      Outro: 'other',
      // Mapeamentos diretos caso já venha minúsculo
      pix: 'pix',
      card: 'card',
      deposit: 'deposit',
      transfer: 'transfer',
      boleto: 'boleto',
      other: 'other',
    };
    return map[value] || 'other';
  }

  // Map legacy CreateServiceOrderDto -> CreateOrderDto
  static toCreateOrderDto(input: CreateServiceOrderDto): CreateOrderDto {
    // 1. Identifica o método de pagamento raiz (baseado no primeiro serviço ou padrão)
    const rawPaymentMethod = input.services?.[0]?.paymentMethod || 'PIX';
    const rootPaymentMethod = this.mapToBackendEnum(rawPaymentMethod);

    // 2. Mapeia os Itens (Removendo paymentMethod interno)
    const items: CreateOrderItemDto[] = (input.services || []).map(
      (s: ServiceOrderItemDto) => ({
        functionalityId: s.functionalityId,
        // clientId inherited from order
        price: Number(s.totalPrice) || 0,
        // paymentMethod: REMOVIDO (Não aceito pelo backend dentro do item)
        clientDeadline: s.clientDeadline,
        description: s.description,

        // Garante envio seguro de UUID ou undefined
        responsibleUserId:
          s.responsibleUserId && s.responsibleUserId.length > 5
            ? s.responsibleUserId
            : undefined,

        assistantDeadline: s.assistantDeadline,
        assistantAmount:
          s.price !== undefined
            ? Number(s.price)
            : s.assistantAmount !== undefined
            ? Number(s.assistantAmount)
            : undefined,

        serviceStartDate: s.serviceStartDate,
        serviceEndDate: s.serviceEndDate,
        userStatus: s.userStatus as any,
        userDescription: s.userDescription,
      })
    );

    // 3. Mapeia Parcelas (Convertendo channel para minúsculo)
    const installments =
      input.installments?.map((inst) => ({
        amount: inst.amount,
        dueDate: inst.dueDate,
        channel: this.mapToBackendEnum(inst.channel as string),
      })) || [];

    const dto: CreateOrderDto = {
      clientId: input.clientId,
      contractDate: input.contractDate,
      description: input.description,
      paymentMethod: rootPaymentMethod, // Novo campo obrigatório na raiz
      installments: installments,
      items: items,
    };
    return dto;
  }

  // Map new OrderResponseDto -> legacy ServiceOrderResponseDto (for old UI)
  static toLegacyServiceOrderResponse(order: OrderResponseDto): any {
    // Retorno any temporário para flexibilizar compatibilidade
    return {
      clientId: order.clientId,
      clientName: order.client?.name || '',
      clientEmail: '',
      totalAmount: order.amountTotal,
      totalAssistantAmount:
        order.items?.reduce(
          (sum, it) => sum + (it.responsible?.amount || 0),
          0
        ) || 0,
      serviceCount: order.items?.length || 0,
      services: (order.items || []).map((it) => ({
        id: it.id,
        functionalityId: it.functionality.id,
        functionalityName: it.functionality.name || '',
        totalPrice: it.price,
        paymentMethod: it.paymentMethod || '', // Backend pode não retornar, manter fallback
        clientDeadline: it.clientDeadline,
        contractDate: order.contractDate,
        status: 'PENDING_PAYMENT' as any,
        paidAt:
          order.paymentStatus === 'PAID'
            ? order.updatedAt || order.createdAt
            : undefined,
        responsibleUserId: it.responsible?.userId,
        responsibleUserName: it.responsible?.name,
        assistantDeadline: it.responsible?.assistantDeadline || undefined,
        assistantAmount: it.responsible?.amount,
        assistantPaidAt: undefined,
        delivered:
          it.userStatus === 'DELIVERED' || it.userStatus === 'COMPLETED',
        createdAt: new Date(order.createdAt),
        serviceStartDate: it.serviceStartDate,
        serviceEndDate: it.serviceEndDate,
      })),
      createdAt: new Date(order.createdAt),
      hasOverdueCollaborators: (order.items || []).some(
        (it) => it.userStatus === 'OVERDUE'
      ),
    };
  }

  // Map Orders -> legacy list card item shape
  static toLegacyServiceOrderListItem(
    order: OrderResponseDto
  ): ServiceOrderResponse {
    const aggDeadline =
      (order.items || [])
        .map((i) => i.clientDeadline)
        .filter(Boolean)
        .sort()
        .slice(-1)[0] || order.contractDate;

    const totalAssistant =
      (order.items || []).reduce(
        (sum, it) => sum + (it.responsible?.amount || 0),
        0
      ) || 0;

    const mapWorkToSimple = (w: string): ServiceOrderResponse['status'] => {
      switch (w) {
        case 'OVERDUE':
          return 'OVERDUE';
        case 'COMPLETED':
          return 'FINISHED';
        case 'IN_PROGRESS':
        case 'AWAITING_CLIENT':
        case 'AWAITING_ADVISOR':
          return 'IN_PROGRESS';
        case 'CANCELED':
        case 'PENDING':
        default:
          return 'PENDING';
      }
    };

    return {
      orderId: order.id,
      clientId: order.clientId,
      clientName: order.client?.name || '',
      clientEmail: '',
      clientInstitution: undefined,
      deadline: aggDeadline,
      contractDate: order.contractDate,
      total: order.amountTotal,
      totalAssistantAmount: totalAssistant,
      serviceCount: order.items?.length || 0,
      status: mapWorkToSimple(order.workStatus),
      hasOverdueCollaborators: (order.items || []).some(
        (i) => i.userStatus === 'OVERDUE'
      ),
      services: (order.items || []).map((it) => ({
        id: it.id,
        functionalityId: it.functionality.id,
        functionalityName: it.functionality.name || '',
        totalPrice: it.price,
        paymentMethod: it.paymentMethod || '',
        clientDeadline: it.clientDeadline,
        contractDate: order.contractDate,
        status:
          order.paymentStatus === 'PAID'
            ? (FunctionalitiesClientsStatus.PAID as any)
            : (FunctionalitiesClientsStatus.PENDING_PAYMENT as any),
        paidAt:
          order.paymentStatus === 'PAID'
            ? order.updatedAt || order.createdAt
            : undefined,
        responsibleUserId: it.responsible?.userId,
        responsibleUserName: it.responsible?.name,
        assistantDeadline: it.responsible?.assistantDeadline || undefined,
        assistantAmount: it.responsible?.amount,
        serviceStartDate: it.serviceStartDate,
        serviceEndDate: it.serviceEndDate,
        userStatus: it.userStatus,
        price: it.responsible?.amount,
        delivered:
          it.userStatus === 'DELIVERED' || it.userStatus === 'COMPLETED',
        createdAt: order.createdAt,
      })),
      createdAt: order.createdAt,
    };
  }
}
