import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../auth/auth.service';

export interface EventItem {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  modality?: string;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly publicUrl = `${API_BASE_URL}/api/v1/public/events`;
  private readonly adminUrl = `${API_BASE_URL}/api/v1/admin/events`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getPublic(): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(this.publicUrl);
  }

  create(payload: EventItem): Observable<EventItem> {
    return this.http.post<EventItem>(this.adminUrl, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: EventItem): Observable<EventItem> {
    return this.http.put<EventItem>(`${this.adminUrl}/${id}`, payload, { headers: this.authHeaders() });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
