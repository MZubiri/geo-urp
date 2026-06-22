import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export interface UserItem {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  roles?: string[];
  phone?: string;
  major?: string;
  cycle?: number;
}

export interface RoleItem {
  id?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly baseUrl = `/api/v1/admin/users`;
  private readonly rolesUrl = `/api/v1/admin/roles`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getUsers(): Observable<unknown> {
    return this.http.get<unknown>(this.baseUrl, {
      headers: this.authHeaders(),
    });
  }

  getRoles(): Observable<unknown> {
    return this.http.get<unknown>(this.rolesUrl, {
      headers: this.authHeaders(),
    });
  }

  create(payload: UserItem): Observable<unknown> {
    return this.http.post<unknown>(this.baseUrl, payload, {
      headers: this.authHeaders(),
    });
  }

  update(id: number, payload: UserItem): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/${id}`, payload, {
      headers: this.authHeaders(),
    });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.authHeaders(),
    });
  }

  updateRoles(id: number, roles: string[]): Observable<unknown> {
    return this.http.patch<unknown>(`${this.baseUrl}/${id}/roles`, { roles }, {
      headers: this.authHeaders(),
    });
  }

  getPendingUsers(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/pending`, {
      headers: this.authHeaders(),
    });
  }

  approveUser(id: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/${id}/approve`, {}, {
      headers: this.authHeaders(),
    });
  }

  rejectUser(id: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/${id}/reject`, {}, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}

