import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FunctionalityDto,
  CreateFunctionalityDto,
  ResponsibleUser,
} from '../interfaces/functionalities.interface';
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
}
