import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { EventItem, EventsService } from '../../../core/events/events.service';

interface EventForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  modality: string;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos implements OnInit {
  eventos: EventItem[] = [];
  cargando = false;
  error = '';
  guardando = false;
  editandoId: number | null = null;

  form: EventForm = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    modality: 'Presencial',
  };

  constructor(
    private eventsService: EventsService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.error = '';

    this.eventsService
      .getPublic()
      .pipe(timeout(10000), finalize(() => (this.cargando = false)))
      .subscribe({
        next: (response) => {
          this.eventos = this.normalizeEvents(response).sort(
            (a, b) => new Date(this.startDate(a)).getTime() - new Date(this.startDate(b)).getTime(),
          );
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  editar(evento: EventItem): void {
    this.editandoId = evento.id ?? null;
    this.form = {
      title: evento.title ?? evento.name ?? '',
      description: evento.description ?? '',
      startDate: this.toDateTimeLocal(this.startDate(evento)),
      endDate: this.toDateTimeLocal(this.endDate(evento)),
      location: evento.location ?? '',
      modality: evento.modality ?? 'Presencial',
    };
  }

  guardar(): void {
    if (!this.authService.isAdmin()) {
      return;
    }

    const payload: EventItem = {
      title: this.form.title,
      description: this.form.description,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      location: this.form.location,
      modality: this.form.modality,
    };

    this.guardando = true;
    const request = this.editandoId
      ? this.eventsService.update(this.editandoId, payload)
      : this.eventsService.create(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicion();
        this.cargarEventos();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.getErrorMessage(error);
      },
    });
  }

  eliminar(evento: EventItem): void {
    if (!this.authService.isAdmin() || !evento.id) {
      return;
    }

    this.guardando = true;
    this.eventsService.remove(evento.id).subscribe({
      next: () => {
        this.guardando = false;
        this.cargarEventos();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.getErrorMessage(error);
      },
    });
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.form = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      modality: 'Presencial',
    };
  }

  isPast(evento: EventItem): boolean {
    return new Date(this.endDate(evento)) < new Date();
  }

  googleCalendarLink(evento: EventItem): string {
    const start = this.toCalendarDate(this.startDate(evento));
    const end = this.toCalendarDate(this.endDate(evento));

    return (
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(evento.title ?? evento.name ?? '')}` +
      `&dates=${start}/${end}` +
      `&details=${encodeURIComponent(evento.description ?? '')}` +
      `&location=${encodeURIComponent(evento.location ?? '')}`
    );
  }

  startDate(evento: EventItem): string {
    return evento.startDate ?? '';
  }

  endDate(evento: EventItem): string {
    return evento.endDate ?? evento.startDate ?? '';
  }

  private toDateTimeLocal(value: string): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 16);
  }

  private toCalendarDate(value: string): string {
    return value.replace(/[-:]/g, '').replace('.000', '').replace('Z', '');
  }

  private normalizeEvents(response: unknown): EventItem[] {
    return this.extractArray(response) as EventItem[];
  }

  private extractArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!this.isRecord(payload)) {
      return [];
    }

    const directKeys = ['data', 'items', 'results', 'value', 'content'];

    for (const key of directKeys) {
      const candidate = payload[key];

      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (this.isRecord(candidate)) {
        const nested = this.extractArray(candidate);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) {
        return value;
      }

      if (this.isRecord(value)) {
        const nested = this.extractArray(value);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (error.status) {
      return `No se pudo completar la operación en eventos (HTTP ${error.status}).`;
    }

    return 'No se pudo completar la operación en eventos.';
  }
}
