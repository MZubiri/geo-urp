import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer-container glass-panel">
      <div class="footer-content">
        <div class="footer-brand">
          <p class="footer-desc">Plataforma de gestión Oficial de GEO URP</p>
        </div>
        <div class="footer-copy">
          &copy; 2026 GEO URP. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-container {
      margin-top: auto;
      border-radius: 0;
      border-top: 1px solid var(--glass-border);
      padding: 24px;
      text-align: center;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .footer-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .footer-copy {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  `]
})
export class FooterComponent {}
