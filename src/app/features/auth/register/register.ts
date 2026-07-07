import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  major = '';
  cycle: number | null = null;
  
  error = '';
  successMessage = '';
  cargando = false;
  mostrarPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  irLogin(): void {
    this.router.navigate(['/login']);
  }

  irInicio(): void {
    this.router.navigate(['/']);
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  isValidUrpEmail(email: string): boolean {
    return /^[^\s@]+@urp\.edu\.pe$/.test(email.trim().toLowerCase());
  }

  register(): void {
    if (!this.name.trim()) {
      this.error = 'Completa tu nombre completo.';
      return;
    }

    const emailTrimed = this.email.trim();
    if (!emailTrimed) {
      this.error = 'Completa tu correo institucional.';
      return;
    }

    if (!this.isValidUrpEmail(emailTrimed)) {
      this.error = 'El correo debe ser institucional y terminar en @urp.edu.pe';
      return;
    }

    if (!this.phone.trim()) {
      this.error = 'Completa tu número de teléfono.';
      return;
    }

    if (!this.major.trim()) {
      this.error = 'Completa tu carrera profesional.';
      return;
    }

    if (this.cycle === null || this.cycle < 1 || this.cycle > 12) {
      this.error = 'Completa un ciclo académico válido (1-12).';
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.error = '';
    this.successMessage = '';
    this.cargando = true;

    const payload = {
      name: this.name.trim(),
      email: emailTrimed.toLowerCase(),
      phone: this.phone.trim(),
      password: this.password,
      major: this.major.trim(),
      cycle: this.cycle !== null ? String(this.cycle) : '',
    };

    this.authService
      .register(payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Registro exitoso. Tu cuenta está pendiente de aprobación por la directiva.';
          this.resetForm();
        },
        error: (err: unknown) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  private resetForm(): void {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.password = '';
    this.confirmPassword = '';
    this.major = '';
    this.cycle = null;
  }

  private getErrorMessage(error: unknown): string {
    if (this.isRecord(error) && error['name'] === 'TimeoutError') {
      return 'La solicitud demoró demasiado. Intenta nuevamente.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor backend.';
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
        return error.error['message'];
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Ocurrió un error al procesar el registro. Inténtalo de nuevo.';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
