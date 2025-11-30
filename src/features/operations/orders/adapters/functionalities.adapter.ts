// Adapter to keep legacy functionalities screens working while consuming new /orders APIs
// Provides mapping helpers to convert between legacy ServiceOrder DTOs and new Orders DTOs

import {
  CreateServiceOrderDto,
  ServiceOrderItemDto,
  ServiceOrderResponseDto,
} from '../../functionalities/interfaces/service-order.interface';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderResponseDto,
} from '../../../../app/shared/models/orders';
import { ServiceOrderResponse } from '../../functionalities/interfaces/order-list.interface';
import { FunctionalitiesClientsStatus } from '../../functionalities/interfaces/status.enums';

export class FunctionalitiesOrdersAdapter {
  // Map legacy CreateServiceOrderDto -> CreateOrderDto
  static toCreateOrderDto(input: CreateServiceOrderDto): CreateOrderDto {
    const items: CreateOrderItemDto[] = (input.services || []).map(
      (s: ServiceOrderItemDto) => ({
        functionalityId: s.functionalityId,
        // clientId inherited from order
        price: Number(s.totalPrice) || 0,
        paymentMethod: s.paymentMethod,
        clientDeadline: s.clientDeadline,
        description: s.description,
        responsibleUserId: s.responsibleUserId,
        assistantDeadline: s.assistantDeadline,
        amountForAssistant:
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

    const dto: CreateOrderDto = {
      clientId: input.clientId,
      contractDate: input.contractDate,
      description: input.description,
      // paymentTerms left undefined -> backend defaults or rules apply
      items,
    };
    return dto;
  }

  // Map new OrderResponseDto -> legacy ServiceOrderResponseDto (for old UI)
  static toLegacyServiceOrderResponse(
    order: OrderResponseDto
  ): ServiceOrderResponseDto {
    return {
      clientId: order.clientId,
      clientName: order.client?.name || '',
      clientEmail: '', // not available in new model
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
        paymentMethod: it.paymentMethod || '',
        clientDeadline: it.clientDeadline,
        contractDate: order.contractDate,
        status: 'PENDING_PAYMENT' as any, // legacy UI status; backend determines aggregate status elsewhere
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
        .slice(-1)[0] || order.contractDate; // choose latest client deadline

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
      clientEmail: '', // not available in new model
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
