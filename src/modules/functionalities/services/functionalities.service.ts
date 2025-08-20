import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  FunctionalityDto,
  CreateFunctionalityDto,
  ResponsibleUser,
} from '../interfaces/functionalities.interface';
import {
  CreateServiceOrderDto,
  ServiceOrderResponseDto,
  ServiceOrderSummaryDto,
  AssistantUser,
} from '../interfaces/service-order.interface';
import {
  ServiceOrderResponse,
  AssignmentResponse,
} from '../interfaces/order-list.interface';
import { environment } from '../../../environments/environment';
import { OrdersService } from '../../orders/services/orders.service';
import { FunctionalitiesOrdersAdapter } from '../../orders/adapters/functionalities.adapter';

@Injectable({ providedIn: 'root' })
export class FunctionalitiesService {
  private baseUrl = '/functionalities';
  private apiUrl = environment.apiUrl; // URL base da API
  // feature flag to switch to new orders backend via adapter
  private useOrdersAdapter = true;

  constructor(private http: HttpClient, private orders: OrdersService) {}

  getAll(): Observable<FunctionalityDto[]> {
    return this.http.get<FunctionalityDto[]>(`${this.apiUrl}${this.baseUrl}`);
  }

  create(dto: CreateFunctionalityDto): Observable<FunctionalityDto> {
    return this.http.post<FunctionalityDto>(
      `${this.apiUrl}${this.baseUrl}`,
      dto
    );
  }

  getResponsibleUsers(): Observable<ResponsibleUser[]> {
    return this.http.get<ResponsibleUser[]>(`${this.apiUrl}/user/children`);
  }

  // Service Order methods
  /**
   * @deprecated Usar OrdersService.create com DTO de Orders. Mantido para compatibilidade das telas antigas.
   */
  createServiceOrder(
    dto: CreateServiceOrderDto
  ): Observable<ServiceOrderResponseDto> {
    if (this.useOrdersAdapter) {
      const payload = FunctionalitiesOrdersAdapter.toCreateOrderDto(dto);
      return this.orders
        .create(payload)
        .pipe(
          map((order) =>
            FunctionalitiesOrdersAdapter.toLegacyServiceOrderResponse(order)
          )
        );
    }
    return this.http.post<ServiceOrderResponseDto>(
      `${this.apiUrl}${this.baseUrl}/service-order`,
      dto
    );
  }

  /**
   * @deprecated Usar OrdersService.list + mapeamento para o shape legado (ServiceOrderResponseDto).
   */
  getAllServiceOrders(): Observable<ServiceOrderResponseDto[]> {
    if (this.useOrdersAdapter) {
      return this.orders
        .list()
        .pipe(
          map((page) =>
            (page?.data || []).map((o) =>
              FunctionalitiesOrdersAdapter.toLegacyServiceOrderResponse(o)
            )
          )
        );
    }
    return this.http.get<ServiceOrderResponseDto[]>(
      `${this.apiUrl}${this.baseUrl}/service-order`
    );
  }

  /**
   * @deprecated Usar OrdersService.list({ clientId }) ou findOne, com mapeamento para o shape legado.
   */
  getServiceOrderByClient(
    clientId: string
  ): Observable<ServiceOrderResponseDto> {
    if (this.useOrdersAdapter) {
      // best-effort: list by client and return first
      return this.orders.list({ clientId, pageSize: 1 }).pipe(
        map((page) => {
          const first = page?.data?.[0];
          if (!first) {
            throw new HttpErrorResponse({
              status: 404,
              error: { message: 'not_found' },
            });
          }
          return FunctionalitiesOrdersAdapter.toLegacyServiceOrderResponse(
            first
          );
        })
      );
    }
    return this.http.get<ServiceOrderResponseDto>(
      `${this.apiUrl}${this.baseUrl}/service-order/client/${clientId}`
    );
  }

  getServiceOrderSummary(): Observable<ServiceOrderSummaryDto> {
    return this.http.get<ServiceOrderSummaryDto>(
      `${this.apiUrl}${this.baseUrl}/service-order/summary`
    );
  }

  // Listar todas as ordens de serviço (para managers)
  /**
   * @deprecated Usar OrdersService.list com paginação e mapeamento para o shape legado de lista.
   */
  getAllServiceOrdersList(
    params?: Record<string, any>
  ): Observable<ServiceOrderResponse[]> {
    if (this.useOrdersAdapter) {
      return this.orders
        .list(params)
        .pipe(
          map((page) =>
            (page.data || []).map((o) =>
              FunctionalitiesOrdersAdapter.toLegacyServiceOrderListItem(o)
            )
          )
        );
    }
    return this.http.get<ServiceOrderResponse[]>(
      `${this.apiUrl}${this.baseUrl}/service-order`,
      { params: params as any }
    );
  }

  // Listar atribuições do assistant logado
  getMyAssignments(): Observable<AssignmentResponse[]> {
    return this.http.get<AssignmentResponse[]>(
      `${this.apiUrl}${this.baseUrl}/service-order/my-assignments`
    );
  }

  getAssistantUsers(): Observable<AssistantUser[]> {
    return this.http.get<AssistantUser[]>(`${this.apiUrl}/user/children`);
  }

  // Responsibles for a specific functionality (filtered and authorized by backend)
  getFunctionalityResponsibles(
    functionalityId: string
  ): Observable<AssistantUser[]> {
    return this.http.get<AssistantUser[]>(
      `${this.apiUrl}${this.baseUrl}/${functionalityId}/responsibles`
    );
  }

  // Single responsible for a functionality (id, name, email)
  getFunctionalityResponsible(
    functionalityId: string
  ): Observable<{ userId: string; name: string; email: string }> {
    return this.http.get<{ userId: string; name: string; email: string }>(
      `${this.apiUrl}${this.baseUrl}/${functionalityId}/responsible`
    );
  }

  update(
    id: string,
    dto: Partial<CreateFunctionalityDto>
  ): Observable<FunctionalityDto> {
    const body: any = { ...dto };
    if (body.minimumPrice !== undefined)
      body.minimumPrice = Number(body.minimumPrice);
    if (body.defaultAssistantPrice !== undefined)
      body.defaultAssistantPrice = Number(body.defaultAssistantPrice);
    return this.http.put<FunctionalityDto>(
      `${this.apiUrl}${this.baseUrl}/${id}`,
      body
    );
  }

  softDelete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.baseUrl}/${id}`);
  }
}
