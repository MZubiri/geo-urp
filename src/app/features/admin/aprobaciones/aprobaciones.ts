import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { UserItem, UsersService } from '../../../core/users/users.service';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aprobaciones.html',
  styleUrl: './aprobaciones.css',
})
export class Aprobaciones implements OnInit {
  pendingUsers: UserItem[] = [];
  cargando = false;
  procesandoId: number | null = null;
  error = '';
  mensaje = '';
  permitido = false;

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.permitido = this.authService.canApproveRegistrations();
    if (!this.permitido) {
      this.error = 'No tienes permisos para acceder a esta sección.';
      return;
    }
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    this.usersService
      .getPendingUsers()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.pendingUsers = this.extractData(response);
        },
        error: (err: unknown) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  aprobar(user: UserItem): void {
    if (!user.id) return;
    this.procesandoId = user.id;
    this.error = '';
    this.mensaje = '';

    this.usersService
      .approveUser(user.id)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.procesandoId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.mensaje = `Usuario ${user.name} aprobado exitosamente.`;
          this.pendingUsers = this.pendingUsers.filter((u) => u.id !== user.id);
        },
        error: (err: unknown) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  rechazar(user: UserItem): void {
    if (!user.id) return;
    if (!confirm(`¿Estás seguro de rechazar y eliminar el registro de ${user.name}?`)) {
      return;
    }

    this.procesandoId = user.id;
    this.error = '';
    this.mensaje = '';

    this.usersService
      .rejectUser(user.id)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.procesandoId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.mensaje = `Registro de ${user.name} rechazado y eliminado.`;
          this.pendingUsers = this.pendingUsers.filter((u) => u.id !== user.id);
        },
        error: (err: unknown) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  private extractData(response: any): UserItem[] {
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'No tienes autorización para realizar esta acción.';
      }
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }
      if (error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado al procesar la solicitud.';
  }
}
