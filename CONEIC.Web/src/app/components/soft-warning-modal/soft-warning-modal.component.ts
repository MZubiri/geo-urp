import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-soft-warning-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content warning-box" (click)="$event.stopPropagation()">
        <div class="warning-icon">⚠️</div>
        <h3>Cruce de Horarios Detectado</h3>
        <p class="warning-text">
          La actividad que intentas agregar coincide en horario con 
          <strong>"{{ conflictingActivityName }}"</strong> ya guardada en tu calendario.
        </p>

        <div class="modal-actions-grid">
          <button (click)="onReplace()" class="btn btn-gold btn-block">
            Reemplazar anterior
          </button>
          <button (click)="onAddAnyway()" class="btn btn-primary btn-block">
            Agregar de todas formas
          </button>
          <button (click)="onCancel()" class="btn btn-outline btn-block">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .warning-box {
      text-align: center;
      border-color: rgba(245, 158, 11, 0.4);
    }
    .warning-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }
    h3 {
      font-size: 1.3rem;
      margin-bottom: 12px;
      color: #fbbf24;
    }
    .warning-text {
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .modal-actions-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn-block {
      width: 100%;
    }
  `]
})
export class SoftWarningModalComponent {
  @Input() conflictingActivityName: string = '';
  @Output() replace = new EventEmitter<void>();
  @Output() addAnyway = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onReplace(): void { this.replace.emit(); }
  onAddAnyway(): void { this.addAnyway.emit(); }
  onCancel(): void { this.cancel.emit(); }
}
