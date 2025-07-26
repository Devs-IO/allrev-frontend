import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FunctionalitiesService {
  private baseUrl = '/functionalities';
  private apiUrl = environment.apiUrl; // URL base da API

  constructor(private http: HttpClient) {}

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
  createServiceOrder(
    dto: CreateServiceOrderDto
  ): Observable<ServiceOrderResponseDto> {
    return this.http.post<ServiceOrderResponseDto>(
      `${this.apiUrl}${this.baseUrl}/service-order`,
      dto
    );
  }

  getAllServiceOrders(): Observable<ServiceOrderResponseDto[]> {
    return this.http.get<ServiceOrderResponseDto[]>(
      `${this.apiUrl}${this.baseUrl}/service-order`
    );
  }

  getServiceOrderByClient(
    clientId: string
  ): Observable<ServiceOrderResponseDto> {
    return this.http.get<ServiceOrderResponseDto>(
      `${this.apiUrl}${this.baseUrl}/service-order/client/${clientId}`
    );
  }

  getServiceOrderSummary(): Observable<ServiceOrderSummaryDto> {
    return this.http.get<ServiceOrderSummaryDto>(
      `${this.apiUrl}${this.baseUrl}/service-order/summary`
    );
  }

  getAssistantUsers(): Observable<AssistantUser[]> {
    return this.http.get<AssistantUser[]>(`${this.apiUrl}/user/children`);
  }
}
