import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models/coneic.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/coneic/api/auth';
  public currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): User | null {
    const data = localStorage.getItem('coneic_user');
    return data ? JSON.parse(data) : null;
  }

  register(data: { nombre: string; correo: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(user => this.setSession(user))
    );
  }

  login(data: { correo: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(user => this.setSession(user))
    );
  }

  logout(): void {
    localStorage.removeItem('coneic_user');
    this.currentUser.set(null);
  }

  private setSession(user: User): void {
    localStorage.setItem('coneic_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  getToken(): string | null {
    return this.currentUser()?.token || null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.rol === 'ADMIN';
  }
}
