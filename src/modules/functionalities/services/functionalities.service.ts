import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ServiceDefinitionDto {
  id: string;
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
}

@Injectable({ providedIn: 'root' })
export class FunctionalitiesService {
  private baseUrl = '/services';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServiceDefinitionDto[]> {
    return this.http.get<ServiceDefinitionDto[]>(this.baseUrl);
  }

  create(dto: CreateServiceDto): Observable<ServiceDefinitionDto> {
    return this.http.post<ServiceDefinitionDto>(this.baseUrl, dto);
  }
}
