import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../auth/auth.service';

export interface BoardMember {
  id?: number;
  fullName?: string;
  name?: string;
  roleName?: string;
  role?: string;
  specialty?: string;
  email?: string;
  imageUrl?: string;
  photoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class BoardMembersService {
  private readonly publicUrl = `${API_BASE_URL}/api/v1/public/board-members`;
  private readonly adminUrl = `${API_BASE_URL}/api/v1/admin/board-members`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getPublic(): Observable<BoardMember[]> {
    return this.http.get<BoardMember[]>(this.publicUrl);
  }

  create(payload: BoardMember): Observable<BoardMember> {
    return this.http.post<BoardMember>(this.adminUrl, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: BoardMember): Observable<BoardMember> {
    return this.http.put<BoardMember>(`${this.adminUrl}/${id}`, payload, { headers: this.authHeaders() });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
