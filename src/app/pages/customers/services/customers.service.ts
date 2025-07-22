import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private apiUrl = environment.apiUrl; // URL base da API
  private http = inject(HttpClient);

  createCustomer(data: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/client`, data);
  }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client`);
  }

  getCustomerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/${id}`);
  }

  updateCustomer(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/client/${id}`, data);
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/client/${id}`);
  }
}
