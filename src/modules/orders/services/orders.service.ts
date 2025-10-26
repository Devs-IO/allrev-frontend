import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderResponseDto,
  PaymentStatus,
} from '../../../app/shared/models/orders';

export interface ListOrdersParams {
  paymentStatus?: PaymentStatus;
  workStatus?: string;
  clientId?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrders {
  data: OrderResponseDto[];
  page: number;
  pageSize: number;
  total: number;
}

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
