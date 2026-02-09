import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

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

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Completa correo y contraseña.';
      return;
    }

    this.error = '';
    this.cargando = true;

    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigate(['/directorio']);
        },
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          this.error = this.getErrorMessage(error);
        },
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo conectar con la API. Revisa si está disponible o si hay CORS.';
    }

    if (error.status === 401) {
      return 'Credenciales inválidas.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    return 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
  }
}
