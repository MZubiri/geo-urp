import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { LibraryService } from '../../../core/library/library.service';
import { AuthService } from '../../../core/auth/auth.service';

export interface Pedido {
  id: number;
  titulo: string;
  solicitante: string;
  fecha: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  pedidos: Pedido[] = [];
  cargando = false;
  error = '';
  vista: 'activos' | 'historial' = 'activos';
  historialPagina = 1;
  readonly historialTamPagina = 8;

  mostrarModal = false;
  pedidoSeleccionado: Pedido | null = null;
  accion: 'aprobar' | 'rechazar' | null = null;

  constructor(
    private libraryService: LibraryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
  }

  get puedeGestionarPedidos(): boolean {
    return this.authService.canManageOrders();
  }

  get pedidosActivos(): Pedido[] {
    return this.pedidos.filter((p) => p.estado === 'Pendiente');
  }

  get pedidosHistorial(): Pedido[] {
    return this.pedidos.filter((p) => p.estado !== 'Pendiente');
  }

  get historialTotalPaginas(): number {
    return Math.max(1, Math.ceil(this.pedidosHistorial.length / this.historialTamPagina));
  }

  get historialPaginaActual(): Pedido[] {
    const inicio = (this.historialPagina - 1) * this.historialTamPagina;
    return this.pedidosHistorial.slice(inicio, inicio + this.historialTamPagina);
  }

  cargarPedidos(): void {
    if (!this.authService.canAccessOrders()) {
      this.cargando = false;
      this.error = 'No tienes permisos para ver pedidos.';
      this.pedidos = [];
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.error = '';
    const request$ = this.libraryService.getAdminBookRequests();

    request$
      .pipe(
        timeout(10000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          try {
            const data = this.extractData(response);
            this.pedidos = data
              .map((item) => this.mapPedido(item))
              .filter((item): item is Pedido => !!item)
              .sort((a, b) => b.id - a.id);
            this.ajustarPaginacionHistorial();
            this.cdr.detectChanges();
          } catch {
            this.error = 'La respuesta de solicitudes no tiene el formato esperado.';
            this.pedidos = [];
            this.ajustarPaginacionHistorial();
            this.cdr.detectChanges();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  abrirModal(p: Pedido, accion: 'aprobar' | 'rechazar'): void {
    if (!this.puedeGestionarPedidos) {
      return;
    }

    this.pedidoSeleccionado = p;
    this.accion = accion;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.pedidoSeleccionado = null;
    this.accion = null;
  }

  confirmarAccion(): void {
    if (!this.pedidoSeleccionado || !this.accion) return;

    const id = this.pedidoSeleccionado.id;
    const req =
      this.accion === 'aprobar'
        ? this.libraryService.sendBookRequest(id, { notes: '' })
        : this.libraryService.rejectBookRequest(id, { notes: '' });

    req.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarPedidos();
      },
      error: (error: HttpErrorResponse) => {
        this.error = this.getErrorMessage(error);
        this.cerrarModal();
        this.cdr.detectChanges();
      },
    });
  }

  private mapPedido(payload: unknown): Pedido | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    const id = this.asNumber(payload['id']);
    if (id === undefined) {
      return null;
    }

    const titulo = this.asString(payload['bookTitle']) ?? 'Sin titulo';
    const solicitante = this.asString(payload['userName']) ?? this.asString(payload['userEmail']) ?? 'Sin solicitante';
    const requestedAt = this.asString(payload['requestedAt']) ?? '';
    const estado = this.toEstado(this.asString(payload['status']));

    return {
      id,
      titulo,
      solicitante,
      fecha: this.formatDate(requestedAt),
      estado,
    };
  }

  private toEstado(status: string | undefined): 'Pendiente' | 'Aprobado' | 'Rechazado' {
    const normalized = (status ?? '').toLowerCase();
    if (normalized.includes('approved') || normalized.includes('sent') || normalized.includes('aprob')) {
      return 'Aprobado';
    }
    if (normalized.includes('rejected') || normalized.includes('denied') || normalized.includes('rech')) {
      return 'Rechazado';
    }
    return 'Pendiente';
  }

  private extractData(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!this.isRecord(response)) {
      return [];
    }

    const data = response['data'];
    if (Array.isArray(data)) {
      return data;
    }

    if (this.isRecord(data) && Array.isArray(data['$values'])) {
      return data['$values'];
    }

    if (this.isRecord(data) && Array.isArray(data['items'])) {
      return data['items'];
    }

    if (Array.isArray(response['items'])) {
      return response['items'];
    }

    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }
    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }
    if (error.status) {
      return `No se pudo completar la operacion (HTTP ${error.status}).`;
    }
    return 'No se pudo completar la operacion.';
  }

  private formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toISOString().slice(0, 10);
  }

  cambiarVista(vista: 'activos' | 'historial'): void {
    this.vista = vista;
    if (vista === 'historial') {
      this.ajustarPaginacionHistorial();
    }
  }

  paginaAnteriorHistorial(): void {
    if (this.historialPagina > 1) {
      this.historialPagina -= 1;
    }
  }

  paginaSiguienteHistorial(): void {
    if (this.historialPagina < this.historialTotalPaginas) {
      this.historialPagina += 1;
    }
  }

  private ajustarPaginacionHistorial(): void {
    const total = this.historialTotalPaginas;
    if (this.historialPagina > total) {
      this.historialPagina = total;
    }
    if (this.historialPagina < 1) {
      this.historialPagina = 1;
    }
  }
}
