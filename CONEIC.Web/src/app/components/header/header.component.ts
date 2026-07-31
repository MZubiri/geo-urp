import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  showChangePasswordModal = false;
  passwordActual = '';
  passwordNueva = '';
  messageSuccess = '';
  messageError = '';
  isLoading = false;

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  openChangePasswordModal(): void {
    this.passwordActual = '';
    this.passwordNueva = '';
    this.messageSuccess = '';
    this.messageError = '';
    this.showChangePasswordModal = true;
    this.cdr.detectChanges();
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.passwordActual = '';
    this.passwordNueva = '';
    this.messageSuccess = '';
    this.messageError = '';
    this.cdr.detectChanges();
  }

  guardarCambioPassword(): void {
    if (!this.passwordActual || !this.passwordNueva) {
      this.messageError = 'Ingresa tu contraseña actual y la nueva contraseña.';
      return;
    }

    if (this.passwordNueva.length < 6) {
      this.messageError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.messageError = '';
    this.messageSuccess = '';

    this.apiService.cambiarPassword({
      passwordActual: this.passwordActual,
      passwordNueva: this.passwordNueva
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messageSuccess = res.message || 'Contraseña actualizada con éxito.';
        setTimeout(() => this.closeChangePasswordModal(), 1800);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageError = err.error?.message || 'Error al cambiar contraseña.';
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
