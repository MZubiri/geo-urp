import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

interface LoginPayload {
  email: string;
  password: string;
}

interface SessionData {
  email: string;
  token: string;
  loggedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = `${API_BASE_URL}/api/v1/auth/login`;
  private readonly sessionStorageKey = 'session';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post(this.loginUrl, payload, {
        responseType: 'text',
      })
      .pipe(
        map((token) => token.trim()),
        tap((token) => this.saveSession(payload.email, token)),
      );
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  isAdmin(): boolean {
    return this.getRoleId() === 1;
  }

  getToken(): string | null {
    const session = this.getSession();
    return session?.token ?? null;
  }

  getRoleId(): number | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);
    const roleValue =
      payload?.['roleId'] ??
      payload?.['role'] ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    const roleId = Number(roleValue);
    return Number.isNaN(roleId) ? null : roleId;
  }

  logout(): void {
    localStorage.removeItem(this.sessionStorageKey);
  }

  private saveSession(email: string, token: string): void {
    const session: SessionData = {
      email,
      token,
      loggedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
  }

  private getSession(): SessionData | null {
    const storedSession = localStorage.getItem(this.sessionStorageKey);

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession) as SessionData;
    } catch {
      this.logout();
      return null;
    }
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');

    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payload);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
