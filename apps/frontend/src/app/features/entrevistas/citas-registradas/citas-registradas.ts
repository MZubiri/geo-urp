import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { InterviewAppointmentRecord, InterviewsService } from '../../../core/interviews/interviews.service';

interface ResponsableFiltro {
  key: string;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-citas-registradas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas-registradas.html',
  styleUrl: './citas-registradas.css',
})
export class CitasRegistradas implements OnInit {
  citas: InterviewAppointmentRecord[] = [];
  cargando = false;
  procesandoId: number | null = null;
  error = '';
  mensaje = '';

  filtroFecha = '';
  busqueda = '';
  responsableSeleccionado = 'Todos';
  readonly responsables: ResponsableFiltro[] = [
    { key: 'Todos', label: 'Todos', date: '', startTime: '', endTime: '' },
    { key: 'MALPARTIDA', label: 'MALPARTIDA', date: '2026-04-13', startTime: '10:00', endTime: '12:00' },
    { key: 'MUJICA', label: 'MUJICA', date: '2026-04-13', startTime: '13:00', endTime: '14:30' },
    { key: 'DENNYS', label: 'DENNYS', date: '2026-04-14', startTime: '17:00', endTime: '19:00' },
    { key: 'FERNANDO', label: 'FERNANDO', date: '2026-04-14', startTime: '17:00', endTime: '19:00' },
    { key: 'PRESI', label: 'PRESI', date: '2026-04-17', startTime: '17:30', endTime: '19:30' },
  ];

  constructor(
    public authService: AuthService,
    private interviewsService: InterviewsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCitas();
  }

  get citasFiltradas(): InterviewAppointmentRecord[] {
    const searchText = this.busqueda.trim().toLowerCase();

    return this.ordenar(this.citas.filter((item) => {
      const fecha = item.slotDate ?? '';
      const nombre = (item.fullName ?? '').toLowerCase();
      const correo = (item.email ?? '').toLowerCase();
      const telefono = (item.phone ?? '').toLowerCase();

      const porFecha = !this.filtroFecha || fecha.startsWith(this.filtroFecha);
      const porResponsable = this.matchesResponsable(item);
      const porTexto = !searchText
        || nombre.includes(searchText)
        || correo.includes(searchText)
        || telefono.includes(searchText);

      return porFecha && porResponsable && porTexto;
    }));
  }

  cargarCitas(): void {
    if (!this.authService.isAdmin()) {
      this.error = 'No tienes permisos para ver las citas registradas.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    this.interviewsService
      .getAppointments()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.citas = this.ordenar(response);
        },
        error: (httpError: HttpErrorResponse) => {
          this.error = this.obtenerMensajeError(httpError);
        },
      });
  }

  eliminarCita(item: InterviewAppointmentRecord): void {
    if (!item.id || this.procesandoId !== null) {
      return;
    }

    const confirmado = window.confirm(`Se eliminara la cita de ${item.fullName ?? 'este usuario'}.`);
    if (!confirmado) {
      return;
    }

    this.procesandoId = item.id;
    this.error = '';
    this.mensaje = '';

    this.interviewsService.removeAppointment(item.id).subscribe({
      next: () => {
        this.citas = this.citas.filter((appointment) => appointment.id !== item.id);
        this.procesandoId = null;
        this.mensaje = 'Cita eliminada correctamente.';
        this.cdr.detectChanges();
      },
      error: (httpError: HttpErrorResponse) => {
        this.procesandoId = null;
        this.error = this.obtenerMensajeError(httpError);
        this.cdr.detectChanges();
      },
    });
  }

  marcarAtendida(item: InterviewAppointmentRecord): void {
    if (!item.id || this.procesandoId !== null || this.estaAtendida(item)) {
      return;
    }

    this.procesandoId = item.id;
    this.error = '';
    this.mensaje = '';

    this.interviewsService.markAppointmentAsAttended(item.id).subscribe({
      next: (updated) => {
        this.citas = this.ordenar(this.citas.map((appointment) =>
          appointment.id === item.id
            ? { ...appointment, status: updated.status || 'Atendida' }
            : appointment));
        this.procesandoId = null;
        this.mensaje = 'Cita marcada como atendida.';
        this.cdr.detectChanges();
      },
      error: (httpError: HttpErrorResponse) => {
        this.procesandoId = null;
        this.error = this.obtenerMensajeError(httpError);
        this.cdr.detectChanges();
      },
    });
  }

  enviarWhatsapp(item: InterviewAppointmentRecord): void {
    const url = this.whatsappUrl(item.phone);
    if (!url) {
      this.error = 'El numero de telefono de esta cita no es valido para WhatsApp.';
      this.cdr.detectChanges();
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  puedeEnviarWhatsapp(item: InterviewAppointmentRecord): boolean {
    return !!this.whatsappUrl(item.phone);
  }

  estaAtendida(item: InterviewAppointmentRecord): boolean {
    return (item.status ?? '').trim().toLowerCase() === 'atendida';
  }

  private ordenar(items: InterviewAppointmentRecord[]): InterviewAppointmentRecord[] {
    return [...items].sort((a, b) => {
      const attendedDifference = Number(this.estaAtendida(a)) - Number(this.estaAtendida(b));
      if (attendedDifference !== 0) {
        return attendedDifference;
      }

      const left = `${a.slotDate ?? ''} ${a.slotStartTime ?? ''}`;
      const right = `${b.slotDate ?? ''} ${b.slotStartTime ?? ''}`;
      return right.localeCompare(left);
    });
  }

  private obtenerMensajeError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    return 'No se pudieron cargar las citas registradas.';
  }

  private whatsappUrl(phone: string | undefined): string | null {
    const normalized = (phone ?? '').replace(/\D/g, '');
    if (!normalized || normalized.length < 9) {
      return null;
    }

    const phoneWithCountryCode =
      normalized.length === 9 ? `51${normalized}` : normalized;

    const message = encodeURIComponent('Hola, vengo de parte de GEOURP porque solicitaste una cita');
    return `https://wa.me/${phoneWithCountryCode}?text=${message}`;
  }

  private matchesResponsable(item: InterviewAppointmentRecord): boolean {
    if (this.responsableSeleccionado === 'Todos') {
      return true;
    }

    const filtro = this.responsables.find((entry) => entry.key === this.responsableSeleccionado);
    if (!filtro || !item.slotDate || !item.slotStartTime || !item.slotEndTime) {
      return false;
    }

    if (item.slotDate !== filtro.date) {
      return false;
    }

    const slotStart = this.toMinutes(item.slotStartTime);
    const slotEnd = this.toMinutes(item.slotEndTime);
    const filtroStart = this.toMinutes(filtro.startTime);
    const filtroEnd = this.toMinutes(filtro.endTime);

    if (slotStart === null || slotEnd === null || filtroStart === null || filtroEnd === null) {
      return false;
    }

    return slotStart >= filtroStart && slotEnd <= filtroEnd;
  }

  private toMinutes(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const parts = value.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return (hours * 60) + minutes;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
