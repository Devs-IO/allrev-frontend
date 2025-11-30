import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { Tenant, CreateTenantDto } from '../interfaces/tenant.interface';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenant`);
  }

  getTenant(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/tenant/${id}`);
  }

  createTenant(data: CreateTenantDto): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/tenant`, data);
  }

  updateTenant(id: string, data: Partial<CreateTenantDto>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/tenant/${id}`, data);
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tenant/${id}`);
  }
}
