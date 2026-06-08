import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import {
  CreateInterviewSlotPayload,
  InterviewSlot,
  InterviewsService,
} from '../../../core/interviews/interviews.service';

@Component({
  selector: 'app-turnos-entrevista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-entrevista.html',
  styleUrl: './turnos-entrevista.css',
})
export class TurnosEntrevista implements OnInit {
  fecha = this.fechaHoy();
  turnos: InterviewSlot[] = [];

  startTime = '';
  endTime = '';
  capacity = 1;

  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  constructor(
    public authService: AuthService,
    private interviewsService: InterviewsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    if (!this.authService.isAdmin()) {
      this.error = 'No tienes permisos para gestionar turnos.';
      return;
    }

    if (!this.fecha) {
      this.error = 'Selecciona una fecha para consultar turnos.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    this.interviewsService
      .getAdminSlots(this.fecha)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (slots) => {
          this.turnos = this.ordenarTurnos(slots);
        },
        error: (httpError: HttpErrorResponse) => {
          this.error = this.obtenerMensajeError(httpError, 'No se pudieron cargar los turnos.');
        },
      });
  }

  crearTurno(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.authService.isAdmin()) {
      this.error = 'No tienes permisos para gestionar turnos.';
      return;
    }

    if (!this.fecha || !this.startTime || !this.endTime || this.capacity < 1) {
      this.error = 'Completa fecha, hora inicio, hora fin y cupos validos.';
      return;
    }

    const payload: CreateInterviewSlotPayload = {
      date: this.fecha,
      startTime: this.startTime,
      endTime: this.endTime,
      capacity: this.capacity,
    };

    this.guardando = true;

    this.interviewsService
      .createSlot(payload)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Turno creado correctamente.';
          this.startTime = '';
          this.endTime = '';
          this.capacity = 1;
          this.cargarTurnos();
        },
        error: (httpError: HttpErrorResponse) => {
          this.error = this.obtenerMensajeError(httpError, 'No se pudo crear el turno.');
        },
      });
  }

  eliminarTurno(slot: InterviewSlot): void {
    if (!this.authService.isAdmin() || !slot.id) {
      this.error = 'No se pudo eliminar el turno seleccionado.';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardando = true;

    this.interviewsService
      .removeSlot(slot.id)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Turno eliminado correctamente.';
          this.cargarTurnos();
        },
        error: (httpError: HttpErrorResponse) => {
          this.error = this.obtenerMensajeError(httpError, 'No se pudo eliminar el turno.');
        },
      });
  }

  disponibilidad(slot: InterviewSlot): string {
    if (slot.available === false) {
      return 'Ocupado';
    }

    if (slot.capacity !== undefined && slot.bookedCount !== undefined) {
      const libres = slot.capacity - slot.bookedCount;
      return libres > 0 ? `Disponible (${libres})` : 'Ocupado';
    }

    return 'Disponible';
  }

  private ordenarTurnos(turnos: InterviewSlot[]): InterviewSlot[] {
    return [...turnos].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  }

  private fechaHoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private obtenerMensajeError(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    return fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
