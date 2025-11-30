import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderResponseDto,
  PaymentStatus,
} from '../../../../app/shared/models/orders';
import { OrderResponseDto as IOrder } from '../interfaces/order.interface';

export interface ListOrdersParams {
  paymentStatus?: PaymentStatus;
  workStatus?: string;
  clientId?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
  // --- ADICIONA ESTES CAMPOS PARA OS NOVOS FILTROS ---
  functionalityId?: string;
  responsibleId?: string;
}

export interface PaginatedOrders {
  data: OrderResponseDto[];
  page: number;
  pageSize: number;
  total: number;
}

// Interface para os filtros (espelhando ListOrdersQueryDto do backend)
export type IListOrdersFilter = ListOrdersParams;

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  create(dto: CreateOrderDto): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(this.baseUrl, dto);
  }

  list(params?: ListOrdersParams): Observable<PaginatedOrders> {
    return this.http.get<PaginatedOrders>(this.baseUrl, {
      params: params as any,
    });
  }

  // --- CORREÇÃO AQUI ---
  // A função agora retorna 'Observable<PaginatedOrders>' (e não mais IOrder[])
  // Removemos o '.pipe(map(res => res.data))'
  getAllOrders(filters?: IListOrdersFilter): Observable<PaginatedOrders> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if ((key === 'from' || key === 'to') && value instanceof Date) {
            params = params.append(key, value.toISOString().split('T')[0]);
          } else {
            params = params.append(key, String(value));
          }
        }
      });
    }

    // O 'map' foi removido. Agora retornamos a resposta paginada completa.
    return this.http.get<PaginatedOrders>(this.baseUrl, { params });
  }

  findOne(id: string): Observable<OrderResponseDto> {
    return this.http.get<OrderResponseDto>(`${this.baseUrl}/${id}`);
  }

  addItem(
    orderId: string,
    dto: CreateOrderItemDto
  ): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(
      `${this.baseUrl}/${orderId}/items`,
      dto
    );
  }

  removeItem(orderId: string, itemId: string): Observable<OrderResponseDto> {
    return this.http.delete<OrderResponseDto>(
      `${this.baseUrl}/${orderId}/items/${itemId}`
    );
  }

  updateInstallments(
    orderId: string,
    installments: Array<{
      id?: string;
      sequence?: number;
      amount?: number;
      dueDate?: string;
    }>
  ): Observable<OrderResponseDto> {
    return this.http.patch<OrderResponseDto>(
      `${this.baseUrl}/${orderId}/installments`,
      { installments }
    );
  }

  payInstallment(
    orderId: string,
    instId: string,
    paidAt?: string
  ): Observable<OrderResponseDto> {
    return this.http.patch<OrderResponseDto>(
      `${this.baseUrl}/${orderId}/installments/${instId}/pay`,
      { paidAt }
    );
  }
}
