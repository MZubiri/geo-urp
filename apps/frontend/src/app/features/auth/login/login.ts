import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  error = '';
  cargando = false;

  mostrarPassword = false;
  mostrarRecuperacion = false;
  recoveryEmail = '';
  recoveryError = '';
  recoveryMessage = '';
  recovering = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  irInicio(): void {
    this.router.navigate(['/']);
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleRecovery(): void {
    this.mostrarRecuperacion = !this.mostrarRecuperacion;
    this.recoveryError = '';
    this.recoveryMessage = '';
    this.recoveryEmail = this.email.trim();
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Completa correo y contrasena.';
      return;
    }

    this.error = '';
    this.cargando = true;

    this.authService
      .login({ email: this.email, password: this.password })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/directorio']);
        },
        error: (error: unknown) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  recuperarPassword(): void {
    const email = (this.recoveryEmail || this.email).trim();
    if (!this.isEmailValid(email)) {
      this.recoveryError = 'Ingresa un correo valido.';
      this.recoveryMessage = '';
      return;
    }

    this.recoveryEmail = email;
    this.recoveryError = '';
    this.recoveryMessage = '';
    this.recovering = true;

    this.authService
      .forgotPassword({ email })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.recovering = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: unknown) => {
          this.recoveryMessage = this.getSuccessMessage(response);
        },
        error: (error: unknown) => {
          this.recoveryError = this.getErrorMessage(error);
        },
      });
  }

  private getSuccessMessage(response: unknown): string {
    if (this.isRecord(response) && typeof response['message'] === 'string' && response['message'].trim().length > 0) {
      return response['message'];
    }

    return 'Si el correo esta registrado, recibiras una contrasena temporal.';
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getErrorMessage(error: unknown): string {
    if (this.isRecord(error) && error['name'] === 'TimeoutError') {
      return 'La solicitud demoro demasiado. Intenta nuevamente.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con la API. Revisa si esta disponible o si hay CORS.';
      }

      if (error.status === 401) {
        return 'Credenciales invalidas.';
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        if (this.looksLikeHtml(error.error)) {
          return 'El servidor web esta devolviendo HTML en /api. Configura el proxy de /api hacia la API.';
        }

        return error.error;
      }

      if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
        return error.error['message'];
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Ocurrio un error al procesar la solicitud. Intentalo nuevamente.';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private looksLikeHtml(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
  }
}
