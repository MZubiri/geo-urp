import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit, OnDestroy {
  profile: UserProfile | null = null;

  newPassword = '';
  confirmPassword = '';
  error = '';
  toastMessage = '';
  guardandoPassword = false;

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private loadingWatchdogId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.profile = this.authService.getUserProfile();
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    if (this.loadingWatchdogId) {
      clearTimeout(this.loadingWatchdogId);
    }
  }

  guardarPassword(): void {
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
    this.guardandoPassword = true;
    this.startLoadingWatchdog();

    this.authService
      .changePassword({
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.guardandoPassword = false;
          this.cdr.detectChanges();
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

  formatLoggedAt(value: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString();
  }

  irInicio(): void {
    this.router.navigate(['/']);
  }

  private getErrorMessage(error: unknown): string {
    if (this.isRecord(error) && error['name'] === 'TimeoutError') {
      return 'La solicitud demoro demasiado. Intenta nuevamente.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con la API.';
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
        return error.error['message'];
      }

      if (error.status === 401) {
        return 'Tu sesion no es valida. Vuelve a iniciar sesion.';
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
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
      if (this.guardandoPassword) {
        this.guardandoPassword = false;
        this.error = 'La solicitud demoro demasiado. Verifica la conexion e intenta nuevamente.';
        this.cdr.detectChanges();
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
      this.cdr.detectChanges();
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
