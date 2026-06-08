import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  mostrarTopbar = true;
  menuMovilAbierto = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.mostrarTopbar = e.urlAfterRedirects !== '/login';
      this.menuMovilAbierto = false;
      this.cdr.detectChanges();
    });
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto = false;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.menuMovilAbierto = false;
    this.router.navigate(['/login']);
  }
}
