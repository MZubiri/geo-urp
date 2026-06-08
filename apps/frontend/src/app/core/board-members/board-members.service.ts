import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export interface BoardMember {
  id?: number;
  fullName?: string;
  name?: string;
  roleName?: string;
  role?: string;
  position?: string;
  specialty?: string;
  bio?: string;
  email?: string;
  code?: string | null;
  birthday?: string | null;
  imageUrl?: string;
  photoUrl?: string;
  sortOrder?: number;
  order?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BoardMembersService {
  private readonly publicUrl = `/api/v1/public/board-members`;
  private readonly adminUrl = `/api/v1/admin/board-members`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getPublic(): Observable<unknown> {
    return this.http.get<unknown>(this.publicUrl, {
      params: this.noCacheParams(),
    });
  }

  getAdmin(): Observable<unknown> {
    return this.http.get<unknown>(this.adminUrl, {
      headers: this.authHeaders(),
      params: this.noCacheParams(),
    });
  }

  create(payload: BoardMember): Observable<unknown> {
    return this.http.post<unknown>(this.adminUrl, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: BoardMember): Observable<unknown> {
    return this.http.put<unknown>(`${this.adminUrl}/${id}`, payload, { headers: this.authHeaders() });
  }

  uploadPhoto(file: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<unknown>(`${this.adminUrl}/upload-photo`, formData, {
      headers: this.authHeaders(),
    });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private noCacheParams(): HttpParams {
    return new HttpParams().set('_ts', Date.now().toString());
  }
}
