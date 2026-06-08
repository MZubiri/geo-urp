import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { InterviewSlot, InterviewsService } from '../../../core/interviews/interviews.service';

interface CitaForm {
  fullName: string;
  phone: string;
  email: string;
  major: string;
  cycle: string;
}

interface FechaDisponible {
  value: string;
  label: string;
}

@Component({
  selector: 'app-registro-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-cita.html',
  styleUrl: './registro-cita.css',
})
export class RegistroCita {
  readonly fechasDisponibles: FechaDisponible[] = [
    { value: '2026-04-13', label: 'Lunes 13/04/2026' },
    { value: '2026-04-14', label: 'Martes 14/04/2026' },
    { value: '2026-04-17', label: 'Viernes 17/04/2026' },
  ];

  readonly carreras = [
    'Ingenier\u00eda Civil',
    'Ingenier\u00eda Electr\u00f3nica',
    'Ingenier\u00eda Industrial',
    'Ingenier\u00eda Inform\u00e1tica',
    'Ingenier\u00eda Mecatr\u00f3nica',
    'Administraci\u00f3n y Gerencia',
    'Administraci\u00f3n de Negocios Globales',
    'Contabilidad y Finanzas',
    'Econom\u00eda',
    'Marketing Global y Administraci\u00f3n Comercial',
    'Turismo, Hoteler\u00eda y Gastronom\u00eda',
    'Medicina Humana',
    'Psicolog\u00eda',
  ];

  readonly ciclos = [
    'Ciclo I',
    'Ciclo II',
    'Ciclo III',
    'Ciclo IV',
    'Ciclo V',
    'Ciclo VI',
    'Ciclo VII',
    'Ciclo VIII',
    'Ciclo IX',
    'Ciclo X',
  ];

  form: CitaForm = {
    fullName: '',
    phone: '',
    email: '',
    major: '',
    cycle: '',
  };

  fecha = '';
  slotId: number | null = null;
  turnosDisponibles: InterviewSlot[] = [];

  cargandoTurnos = false;
  guardando = false;
  mensaje = '';
  error = '';

  constructor(
    private interviewsService: InterviewsService,
    private cdr: ChangeDetectorRef,
  ) {}

  onFechaChange(): void {
    this.slotId = null;
    this.turnosDisponibles = [];
    this.error = '';
    this.mensaje = '';

    if (!this.fecha) {
      return;
    }

    this.cargarTurnosDisponibles();
  }

  cargarTurnosDisponibles(): void {
    if (!this.fecha) {
      this.error = 'Selecciona primero una fecha para ver horarios.';
      return;
    }

    this.cargandoTurnos = true;
    this.error = '';

    this.interviewsService
      .getAvailableSlots(this.fecha)
      .pipe(
        finalize(() => {
          this.cargandoTurnos = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (slots) => {
          this.turnosDisponibles = this.ordenarTurnos(slots);
          this.slotId = null;

          if (this.turnosDisponibles.length === 0) {
            this.error = 'No hay horarios disponibles para la fecha seleccionada.';
          }
        },
        error: (httpError: HttpErrorResponse) => {
          this.error = this.obtenerMensajeError(httpError);
        },
      });
  }

  registrarCita(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.formularioValido()) {
      this.error = 'Completa todos los campos, usa tu correo institucional @urp.edu.pe y selecciona un horario.';
      return;
    }

    this.guardando = true;

    this.interviewsService
      .createAppointment({
        fullName: this.form.fullName.trim(),
        phone: this.form.phone.trim(),
        email: this.form.email.trim(),
        major: this.form.major.trim(),
        cycle: this.form.cycle.trim(),
        slotId: this.slotId!,
      })
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Cita exitosa.';
          this.form = {
            fullName: '',
            phone: '',
            email: '',
            major: '',
            cycle: '',
          };
          this.slotId = null;
          this.cargarTurnosDisponibles();
        },
        error: () => {
          this.error = 'No se pudo registrar la cita. Intente de nuevo.';
        },
      });
  }

  descripcionTurno(slot: InterviewSlot): string {
    const inicio = slot.startTime ?? '--:--';
    const fin = slot.endTime ?? '--:--';
    return `${inicio} - ${fin}`;
  }

  trackByValue(_index: number, value: string): string {
    return value;
  }

  private formularioValido(): boolean {
    return this.fechaDisponibleValida()
      && !!this.slotId
      && !!this.form.fullName.trim()
      && !!this.form.phone.trim()
      && this.correoInstitucionalValido()
      && !!this.form.major.trim()
      && !!this.form.cycle.trim();
  }

  private correoInstitucionalValido(): boolean {
    const email = this.form.email.trim().toLowerCase();
    return /^[a-z0-9._%+-]+@urp\.edu\.pe$/.test(email);
  }

  private fechaDisponibleValida(): boolean {
    return this.fechasDisponibles.some((item) => item.value === this.fecha);
  }

  private ordenarTurnos(turnos: InterviewSlot[]): InterviewSlot[] {
    return [...turnos].sort((a, b) => {
      const left = a.startTime ?? '';
      const right = b.startTime ?? '';
      return left.localeCompare(right);
    });
  }

  private obtenerMensajeError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    return 'No se pudieron cargar los horarios. Intente de nuevo.';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
