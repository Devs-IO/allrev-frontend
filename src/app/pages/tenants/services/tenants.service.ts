import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTenants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tenant`);
  }

  createTenant(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tenant`, data);
  }
}
