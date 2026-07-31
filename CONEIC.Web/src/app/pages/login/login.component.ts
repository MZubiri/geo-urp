import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-panel">
        <div class="auth-header text-center">
          <div class="auth-logo">GEOURP x URP</div>
          <h2>Iniciar Sesión</h2>
          <p>Accede para guardar tu agenda personalizada del CONEIC</p>
        </div>

        <div *ngIf="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" [(ngModel)]="correo" name="correo" required placeholder="tu@correo.com" class="form-input" />
          </div>

          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="form-input" />
          </div>

          <button type="submit" [disabled]="isLoading" class="btn btn-primary btn-block mt-4">
            {{ isLoading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="auth-footer text-center">
          <p>¿No tienes cuenta? <a routerLink="/register">Regístrate aquí</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      min-height: calc(100vh - 160px);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 32px;
    }
    .auth-logo {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--accent-gold);
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 4px; }
    p { color: var(--text-secondary); font-size: 0.9rem; }
    .auth-header { margin-bottom: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .form-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: white;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      outline: none;
    }
    .form-input:focus { border-color: var(--accent-blue); }
    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      padding: 10px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    .auth-footer { margin-top: 24px; font-size: 0.9rem; }
    .auth-footer a { color: var(--accent-gold); text-decoration: none; font-weight: 600; }
    .btn-block { width: 100%; padding: 12px; }
    .mt-4 { margin-top: 16px; }
  `]
})
export class LoginComponent {
  correo = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.correo || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Revisa tus datos.';
      }
    });
  }
}
