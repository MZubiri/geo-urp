import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class Layout implements OnInit {
  mostrarTopbar = true;
  menuMovilAbierto = false;
  temaOscuro = true;

  constructor(
    private router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.mostrarTopbar = e.urlAfterRedirects !== '/login' && e.urlAfterRedirects !== '/register';
      this.menuMovilAbierto = false;
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.inicializarTema();
    this.escucharPreferenciaSistema();
  }

  inicializarTema(): void {
    const temaGuardado = localStorage.getItem('theme');
    if (temaGuardado === 'dark') {
      this.aplicarTema(true);
    } else if (temaGuardado === 'light') {
      this.aplicarTema(false);
    } else {
      const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.aplicarTema(prefiereOscuro);
    }
  }

  escucharPreferenciaSistema(): void {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.aplicarTema(e.matches);
        }
      });
    } catch (e) {
      console.warn('Media query change listener not fully supported', e);
    }
  }

  aplicarTema(esOscuro: boolean): void {
    this.temaOscuro = esOscuro;
    const root = document.documentElement;
    if (esOscuro) {
      root.classList.remove('light-mode');
      root.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
    this.cdr.detectChanges();
  }

  toggleTema(): void {
    this.aplicarTema(!this.temaOscuro);
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
