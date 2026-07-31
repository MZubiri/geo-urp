import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Apartado, Actividad, AgendaResponse, UserAdmin } from '../models/coneic.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/coneic/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Calendario General (Cached)
  getCalendarioGeneral(): Observable<Apartado[]> {
    return this.http.get<Apartado[]>(`${this.baseUrl}/calendario/general`);
  }

  // Mi Calendario
  getMisActividades(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.baseUrl}/agenda/mis-actividades`, { headers: this.getAuthHeaders() });
  }

  agregarActividad(actividadId: number, forceReplace: boolean = false): Observable<AgendaResponse> {
    return this.http.post<AgendaResponse>(
      `${this.baseUrl}/agenda/agregar`,
      { actividadId, forceReplace },
      { headers: this.getAuthHeaders() }
    );
  }

  quitarActividad(actividadId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/agenda/quitar/${actividadId}`, { headers: this.getAuthHeaders() });
  }

  // Admin Operations
  crearApartado(data: { nombre: string; descripcion?: string; orden: number }): Observable<Apartado> {
    return this.http.post<Apartado>(`${this.baseUrl}/admin/apartados`, data, { headers: this.getAuthHeaders() });
  }

  eliminarApartado(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/apartados/${id}`, { headers: this.getAuthHeaders() });
  }

  crearActividad(actividad: Partial<Actividad>): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/admin/actividades`, actividad, { headers: this.getAuthHeaders() });
  }

  actualizarActividad(id: number, actividad: Partial<Actividad>): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.baseUrl}/admin/actividades/${id}`, actividad, { headers: this.getAuthHeaders() });
  }

  eliminarActividad(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/actividades/${id}`, { headers: this.getAuthHeaders() });
  }

  // User Admin Operations
  getUsuarios(): Observable<UserAdmin[]> {
    return this.http.get<UserAdmin[]>(`${this.baseUrl}/admin/usuarios`, { headers: this.getAuthHeaders() });
  }

  crearUsuario(data: { nombre: string; correo: string; password: string; rol: string }): Observable<UserAdmin> {
    return this.http.post<UserAdmin>(`${this.baseUrl}/admin/usuarios`, data, { headers: this.getAuthHeaders() });
  }

  actualizarUsuario(id: number, data: { nombre: string; correo: string; rol: string; password?: string }): Observable<UserAdmin> {
    return this.http.put<UserAdmin>(`${this.baseUrl}/admin/usuarios/${id}`, data, { headers: this.getAuthHeaders() });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/usuarios/${id}`, { headers: this.getAuthHeaders() });
  }
}
