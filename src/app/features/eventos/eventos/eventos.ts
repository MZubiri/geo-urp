import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.error = '';

    this.eventsService
      .getPublic()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.error = '';

          try {
            const todayStart = this.startOfToday();
            this.eventos = this
              .normalizeEvents(response)
              .filter((eventItem) => this.isTodayOrFuture(eventItem, todayStart))
              .sort((a, b) => this.toTimestamp(this.startDate(a)) - this.toTimestamp(this.startDate(b)));
          } catch (e) {
            console.error('Error processing events', e, response);
            this.eventos = [];
            this.error = 'La respuesta de eventos llego, pero no se pudo procesar.';
          }
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
      startAt: this.form.startDate,
      endAt: this.form.endDate,
      location: this.form.location,
      modality: this.form.modality,
    };

    this.guardando = true;
    const request$ = this.editandoId
      ? this.eventsService.update(this.editandoId, payload)
      : this.eventsService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cancelarEdicion();
          this.cargarEventos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  eliminar(evento: EventItem): void {
    if (!this.authService.isAdmin() || !evento.id) {
      return;
    }

    this.guardando = true;
    this.eventsService
      .remove(evento.id)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cargarEventos();
        },
        error: (error: HttpErrorResponse) => {
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
    const end = this.endDate(evento);

    if (!end) {
      return false;
    }

    const parsed = this.parseDate(end);
    if (!parsed) {
      return false;
    }

    return parsed.getTime() < Date.now();
  }

  googleCalendarLink(evento: EventItem): string {
    const startValue = this.startDate(evento);

    if (!startValue) {
      return '#';
    }

    const endValue = this.endDate(evento) ?? startValue;
    const start = this.toCalendarDate(startValue);
    const end = this.toCalendarDate(endValue);

    return (
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(evento.title ?? evento.name ?? '')}` +
      `&dates=${start}/${end}` +
      `&details=${encodeURIComponent(evento.description ?? '')}` +
      `&location=${encodeURIComponent(evento.location ?? '')}`
    );
  }

  startDate(evento: EventItem): string | null {
    return evento.startDate ?? evento.startAt ?? null;
  }

  endDate(evento: EventItem): string | null {
    return evento.endDate ?? evento.endAt ?? evento.startDate ?? evento.startAt ?? null;
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
    return normalized.slice(0, 16);
  }

  private toCalendarDate(value: string | null): string {
    if (!value) {
      return '';
    }

    return value.replace(/[-:]/g, '').replace('.000', '').replace('Z', '');
  }

  private normalizeEvents(response: unknown): EventItem[] {
    const items = this.extractArray(response);
    return items.map((eventItem) => this.mapEvent(eventItem));
  }

  private mapEvent(payload: unknown): EventItem {
    if (!this.isRecord(payload)) {
      return {};
    }

    const start = this.asString(payload['startDate']) ?? this.asString(payload['startAt']);
    const end = this.asString(payload['endDate']) ?? this.asString(payload['endAt']) ?? start;

    return {
      id: this.asNumber(payload['id']),
      title: this.asString(payload['title']) ?? this.asString(payload['name']),
      name: this.asString(payload['name']) ?? this.asString(payload['title']),
      description: this.asString(payload['description']),
      startDate: start,
      endDate: end,
      startAt: start,
      endAt: end,
      location: this.asString(payload['location']),
      modality: this.asString(payload['modality']) ?? 'Presencial',
    };
  }

  private extractArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!this.isRecord(payload)) {
      return [];
    }

    const directKeys = ['data', 'items', 'results', 'value', 'content', '$values'];

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

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
  }

  private toTimestamp(value: string | null): number {
    const parsed = this.parseDate(value);
    return parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER;
  }

  private parseDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isTodayOrFuture(evento: EventItem, todayStart: Date): boolean {
    const end = this.parseDate(this.endDate(evento) ?? this.startDate(evento));
    if (!end) {
      return false;
    }

    return end.getTime() >= todayStart.getTime();
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      if (this.looksLikeHtml(error.error)) {
        return 'El servidor web esta devolviendo HTML en /api. Configura el proxy de /api hacia la API.';
      }

      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    if (error.status) {
      return `No se pudo completar la operacion en eventos (HTTP ${error.status}).`;
    }

    return 'No se pudo completar la operacion en eventos.';
  }

  private looksLikeHtml(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
  }
}
