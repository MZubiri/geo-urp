import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

interface FullUserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  major: string;
  cycle: string;
  birthday?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  linkedInUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit, OnDestroy {
  profileDetails: FullUserProfile | null = null;
  
  // Profile edit fields
  name = '';
  phone = '';
  major = '';
  cycle = '';
  birthday = '';
  bio = '';
  photoUrl = '';
  linkedInUrl = '';

  // Password change fields
  newPassword = '';
  confirmPassword = '';
  
  error = '';
  toastMessage = '';
  guardandoPerfil = false;
  guardandoPassword = false;
  subiendoFoto = false;

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  cargarPerfil(): void {
    this.authService
      .getMyProfile()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const user = response.data || response;
          if (user) {
            this.profileDetails = user;
            this.name = user.name || '';
            this.phone = user.phone || '';
            this.major = user.major || '';
            this.cycle = user.cycle || '';
            this.birthday = user.birthday || '';
            this.bio = user.bio || '';
            this.photoUrl = user.photoUrl || '';
            this.linkedInUrl = user.linkedInUrl || '';
          }
        },
        error: (err: unknown) => {
          this.error = 'No se pudo cargar el perfil detallado. ' + this.getErrorMessage(err);
        },
      });
  }

  guardarPerfil(): void {
    if (!this.name.trim() || !this.phone.trim() || !this.major.trim() || !this.cycle.trim()) {
      this.error = 'Nombre, teléfono, carrera y ciclo son requeridos.';
      this.clearToast();
      return;
    }

    this.error = '';
    this.clearToast();
    this.guardandoPerfil = true;

    const payload = {
      name: this.name.trim(),
      phone: this.phone.trim(),
      major: this.major.trim(),
      cycle: this.cycle.trim(),
      birthday: this.birthday.trim() || null,
      bio: this.bio.trim() || null,
      photoUrl: this.photoUrl.trim() || null,
      linkedInUrl: this.linkedInUrl.trim() || null,
    };

    this.authService
      .updateProfile(payload)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.guardandoPerfil = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.showToast('Perfil actualizado correctamente.');
          this.cargarPerfil();
        },
        error: (err: unknown) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.error = 'El archivo no puede superar los 5 MB.';
      return;
    }

    this.error = '';
    this.subiendoFoto = true;
    this.cdr.detectChanges();

    this.authService
      .uploadProfilePhoto(file)
      .pipe(
        timeout(20000),
        finalize(() => {
          this.subiendoFoto = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          const data = response.data || response;
          if (data && data.url) {
            this.photoUrl = data.url;
            this.showToast('Foto subida. No olvides guardar tu perfil.');
          }
        },
        error: (err: unknown) => {
          this.error = 'Error al subir la foto: ' + this.getErrorMessage(err);
        },
      });
  }

  guardarPassword(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'Completa los campos de contraseña.';
      this.clearToast();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      this.clearToast();
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      this.clearToast();
      return;
    }

    this.error = '';
    this.clearToast();
    this.guardandoPassword = true;

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

  formatLoggedAt(value: string | null | undefined): string {
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
      return 'La solicitud demoró demasiado. Intenta nuevamente.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor.';
      }

      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
        return error.error['message'];
      }

      if (error.status === 401) {
        return 'Tu sesión no es válida. Vuelve a iniciar sesión.';
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Ocurrió un error.';
  }

  private getSuccessMessage(response: unknown): string {
    if (this.isRecord(response) && typeof response['message'] === 'string' && response['message'].trim().length > 0) {
      return response['message'];
    }

    return 'Nueva contraseña guardada correctamente.';
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
