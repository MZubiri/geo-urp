import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  newPassword = '';
  confirmPassword = '';
  error = '';
  toastMessage = '';
  cargando = false;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private loadingWatchdogId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  guardar(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'Completa los campos de contrasena.';
      this.clearToast();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contrasenas no coinciden.';
      this.clearToast();
      return;
    }

    this.error = '';
    this.clearToast();
    this.cargando = true;
    this.startLoadingWatchdog();

    this.authService
      .changePassword({
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargando = false;
        }),
      )
      .subscribe({
        next: (response: unknown) => {
          this.newPassword = '';
          this.confirmPassword = '';
          this.showToast(this.getSuccessMessage(response));
        },
        error: (error: unknown) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  irInicio(): void {
    this.router.navigate(['/']);
  }

  private getErrorMessage(error: unknown): string {
    if (this.isRecord(error) && error['name'] === 'TimeoutError') {
      return 'La API demoro demasiado en responder. Intenta nuevamente.';
    }

    const httpError = error as HttpErrorResponse;

    if (httpError.status === 0) {
      return 'No se pudo conectar con la API.';
    }

    if (typeof httpError.error === 'string' && httpError.error.trim().length > 0) {
      return httpError.error;
    }

    if (typeof httpError.error?.message === 'string' && httpError.error.message.trim().length > 0) {
      return httpError.error.message;
    }

    if (httpError.status === 401) {
      return 'Tu sesion no es valida. Vuelve a iniciar sesion.';
    }

    return 'No se pudo actualizar la contrasena.';
  }

  private getSuccessMessage(response: unknown): string {
    if (this.isRecord(response) && typeof response['message'] === 'string' && response['message'].trim().length > 0) {
      return response['message'];
    }

    return 'Nueva contrasena guardada correctamente.';
  }

  private startLoadingWatchdog(): void {
    if (this.loadingWatchdogId) {
      clearTimeout(this.loadingWatchdogId);
    }

    this.loadingWatchdogId = setTimeout(() => {
      if (this.cargando) {
        this.cargando = false;
        this.error = 'La solicitud demoro demasiado. Verifica la conexion e intenta nuevamente.';
      }
    }, 12000);
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    this.toastTimeoutId = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  private clearToast(): void {
    this.toastMessage = '';
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
