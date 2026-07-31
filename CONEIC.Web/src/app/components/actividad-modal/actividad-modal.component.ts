import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Actividad } from '../../models/coneic.models';
import { IcsService } from '../../services/ics.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-actividad-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actividad-modal.component.html',
  styleUrls: ['./actividad-modal.component.css']
})
export class ActividadModalComponent implements OnInit {
  @Input() actividad: Actividad | null = null;
  @Input() isSaved: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saveToAgenda = new EventEmitter<Actividad>();
  @Output() removeFromAgenda = new EventEmitter<Actividad>();
  @Output() requestLogin = new EventEmitter<void>();

  extraFields: { key: string; value: any }[] = [];

  constructor(private icsService: IcsService, public authService: AuthService) {}

  ngOnInit(): void {
    if (this.actividad?.camposExtra) {
      try {
        const parsed = JSON.parse(this.actividad.camposExtra);
        this.extraFields = Object.keys(parsed).map(key => ({
          key: this.formatKeyLabel(key),
          value: parsed[key]
        }));
      } catch (e) {
        console.error('Error parsing camposExtra JSON', e);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  downloadIcs(): void {
    if (this.actividad) {
      this.icsService.downloadIcs(this.actividad);
    }
  }

  onToggleAgenda(): void {
    if (!this.authService.isLoggedIn()) {
      this.requestLogin.emit();
      return;
    }
    if (this.isSaved) {
      this.removeFromAgenda.emit(this.actividad!);
    } else {
      this.saveToAgenda.emit(this.actividad!);
    }
  }

  private formatKeyLabel(key: string): string {
    return key.replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' });
  }
}
