import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private apiUrl = environment.apiUrl; // URL base da API
  private http = inject(HttpClient);

  createClients(data: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/client`, data);
  }

  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client`);
  }

  getClientsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/${id}`);
  }

  updateClients(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/client/${id}`, data);
  }

  deleteClients(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/client/${id}`);
  }
}
