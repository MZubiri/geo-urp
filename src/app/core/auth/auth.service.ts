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
}
