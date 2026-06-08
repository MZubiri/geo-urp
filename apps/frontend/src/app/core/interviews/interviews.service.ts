import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, defer, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

export interface InterviewSlot {
  id?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  available?: boolean;
  capacity?: number;
  bookedCount?: number;
}

export interface CreateInterviewSlotPayload {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface InterviewAppointmentPayload {
  fullName: string;
  phone: string;
  email: string;
  major: string;
  cycle: string;
  slotId: number;
}

export interface InterviewAppointmentRecord {
  id?: number;
  fullName?: string;
  phone?: string;
  email?: string;
  major?: string;
  cycle?: string;
  status?: string;
  createdAt?: string;
  slotId?: number;
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
}

interface StoredInterviewSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  available: boolean;
}

interface StoredInterviewAppointment extends Required<InterviewAppointmentRecord> {}

@Injectable({ providedIn: 'root' })
export class InterviewsService {
  private readonly publicSlotsUrl = '/api/v1/public/interview-slots';
  private readonly publicAppointmentsUrl = '/api/v1/public/interview-appointments';

  private readonly adminSlotsUrl = '/api/v1/admin/interview-slots';
  private readonly adminAppointmentsUrl = '/api/v1/admin/interview-appointments';
  private readonly localSlotsStorageKey = 'geo-urp.interview-slots';
  private readonly localAppointmentsStorageKey = 'geo-urp.interview-appointments';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getAvailableSlots(date: string): Observable<InterviewSlot[]> {
    const params = new HttpParams().set('date', date);

    return this.http.get<unknown>(this.publicSlotsUrl, { params }).pipe(
      map((response) => this.extractSlots(response).filter((slot) => this.isAvailable(slot))),
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.getLocalAvailableSlots(date));
        }

        return throwError(() => error);
      }),
    );
  }

  createAppointment(payload: InterviewAppointmentPayload): Observable<unknown> {
    return this.http.post<unknown>(this.publicAppointmentsUrl, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.createLocalAppointment(payload));
        }

        return throwError(() => error);
      }),
    );
  }

  getAdminSlots(date: string): Observable<InterviewSlot[]> {
    const params = new HttpParams().set('date', date);

    return this.http.get<unknown>(this.adminSlotsUrl, {
      params,
      headers: this.authHeaders(),
    }).pipe(
      map((response) => this.extractSlots(response)),
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.getLocalSlotsByDate(date));
        }

        return throwError(() => error);
      }),
    );
  }

  createSlot(payload: CreateInterviewSlotPayload): Observable<InterviewSlot> {
    return this.http.post<unknown>(this.adminSlotsUrl, payload, { headers: this.authHeaders() }).pipe(
      map((response) => this.mapSlot(this.extractItem(response))),
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.createLocalSlot(payload));
        }

        return throwError(() => error);
      }),
    );
  }

  removeSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminSlotsUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.removeLocalSlot(id));
        }

        return throwError(() => error);
      }),
    );
  }

  getAppointments(): Observable<InterviewAppointmentRecord[]> {
    return this.http.get<unknown>(this.adminAppointmentsUrl, { headers: this.authHeaders() }).pipe(
      map((response) => this.extractAppointments(response)),
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.getLocalAppointments());
        }

        return throwError(() => error);
      }),
    );
  }

  removeAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminAppointmentsUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.removeLocalAppointment(id));
        }

        return throwError(() => error);
      }),
    );
  }

  markAppointmentAsAttended(id: number): Observable<InterviewAppointmentRecord> {
    return this.http.patch<unknown>(`${this.adminAppointmentsUrl}/${id}/attend`, {}, {
      headers: this.authHeaders(),
    }).pipe(
      map((response) => this.mapAppointment(this.extractItem(response))),
      catchError((error: HttpErrorResponse) => {
        if (this.shouldUseLocalFallback(error)) {
          return this.fromLocal(() => this.markLocalAppointmentAsAttended(id));
        }

        return throwError(() => error);
      }),
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private extractSlots(payload: unknown): InterviewSlot[] {
    return this.extractArray(payload).map((item) => this.mapSlot(item));
  }

  private mapSlot(payload: unknown): InterviewSlot {
    if (!this.isRecord(payload)) {
      return {};
    }

    return {
      id: this.asNumber(payload['id']),
      date: this.asString(payload['date']) ?? this.asString(payload['slotDate']),
      startTime: this.asString(payload['startTime']) ?? this.asString(payload['slotStartTime']),
      endTime: this.asString(payload['endTime']) ?? this.asString(payload['slotEndTime']),
      available: this.asBoolean(payload['available']) ?? this.asBoolean(payload['isAvailable']),
      capacity: this.asNumber(payload['capacity']),
      bookedCount: this.asNumber(payload['bookedCount']) ?? this.asNumber(payload['reservedCount']),
    };
  }

  private extractAppointments(payload: unknown): InterviewAppointmentRecord[] {
    return this.extractArray(payload).map((item) => this.mapAppointment(item));
  }

  private mapAppointment(payload: unknown): InterviewAppointmentRecord {
    if (!this.isRecord(payload)) {
      return {};
    }

    return {
      id: this.asNumber(payload['id']),
      fullName: this.asString(payload['fullName']) ?? this.asString(payload['name']),
      phone: this.asString(payload['phone']),
      email: this.asString(payload['email']),
      major: this.asString(payload['major']) ?? this.asString(payload['career']),
      cycle: this.asString(payload['cycle']),
      status: this.asString(payload['status']),
      createdAt: this.asString(payload['createdAt']) ?? this.asString(payload['createdOn']),
      slotId: this.asNumber(payload['slotId']),
      slotDate: this.asString(payload['slotDate']) ?? this.asString(payload['date']),
      slotStartTime: this.asString(payload['slotStartTime']) ?? this.asString(payload['startTime']),
      slotEndTime: this.asString(payload['slotEndTime']) ?? this.asString(payload['endTime']),
    };
  }

  private extractItem(payload: unknown): unknown {
    if (!this.isRecord(payload)) {
      return payload;
    }

    const candidates = [payload['data'], payload['item'], payload['result'], payload['value']];

    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null) {
        return candidate;
      }
    }

    return payload;
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

  private isAvailable(slot: InterviewSlot): boolean {
    if (slot.available !== undefined) {
      return slot.available;
    }

    if (slot.capacity === undefined || slot.bookedCount === undefined) {
      return true;
    }

    return slot.bookedCount < slot.capacity;
  }

  private fromLocal<T>(factory: () => T): Observable<T> {
    return defer(() => of(factory()));
  }

  private shouldUseLocalFallback(error: HttpErrorResponse): boolean {
    return [0, 404, 405, 501].includes(error.status);
  }

  private getLocalAvailableSlots(date: string): InterviewSlot[] {
    return this.getLocalSlotsByDate(date).filter((slot) => this.isAvailable(slot));
  }

  private getLocalSlotsByDate(date: string): InterviewSlot[] {
    return this.readLocalSlots()
      .filter((slot) => slot.date === date)
      .map((slot) => this.toInterviewSlot(slot))
      .sort((left, right) => (left.startTime ?? '').localeCompare(right.startTime ?? ''));
  }

  private createLocalSlot(payload: CreateInterviewSlotPayload): InterviewSlot {
    const date = payload.date.trim();
    const startTime = payload.startTime.trim();
    const endTime = payload.endTime.trim();
    const capacity = Math.floor(payload.capacity);

    if (!date || !startTime || !endTime || capacity < 1) {
      throw this.localError('Completa fecha, horas y cupos validos.');
    }

    if (endTime <= startTime) {
      throw this.localError('La hora de fin debe ser mayor que la hora de inicio.');
    }

    const slots = this.readLocalSlots();
    const duplicated = slots.some(
      (slot) => slot.date === date && slot.startTime === startTime && slot.endTime === endTime,
    );

    if (duplicated) {
      throw this.localError('Ya existe un turno con ese horario para la fecha seleccionada.');
    }

    const slot: StoredInterviewSlot = {
      id: this.nextId(slots.map((item) => item.id)),
      date,
      startTime,
      endTime,
      capacity,
      bookedCount: 0,
      available: true,
    };

    this.writeLocalSlots([...slots, slot]);
    return this.toInterviewSlot(slot);
  }

  private removeLocalSlot(id: number): void {
    const slots = this.readLocalSlots();
    const slot = slots.find((item) => item.id === id);

    if (!slot) {
      throw this.localError('No se encontro el turno seleccionado.', 404);
    }

    if (slot.bookedCount > 0) {
      throw this.localError('No se puede eliminar un turno que ya tiene citas registradas.');
    }

    this.writeLocalSlots(slots.filter((item) => item.id !== id));
  }

  private createLocalAppointment(payload: InterviewAppointmentPayload): InterviewAppointmentRecord {
    const slotId = payload.slotId;
    const fullName = payload.fullName.trim();
    const phone = payload.phone.trim();
    const email = payload.email.trim();
    const major = payload.major.trim();
    const cycle = payload.cycle.trim();

    if (!fullName || !phone || !email || !major || !cycle || !slotId) {
      throw this.localError('Completa todos los campos y selecciona un horario.');
    }

    const slots = this.readLocalSlots();
    const slotIndex = slots.findIndex((item) => item.id === slotId);

    if (slotIndex < 0) {
      throw this.localError('El horario seleccionado ya no esta disponible.');
    }

    const slot = slots[slotIndex];

    if (!slot.available || slot.bookedCount >= slot.capacity) {
      throw this.localError('El horario seleccionado ya no tiene cupos disponibles.');
    }

    slot.bookedCount += 1;
    slot.available = slot.bookedCount < slot.capacity;

    const appointments = this.readLocalAppointments();
    const appointment: StoredInterviewAppointment = {
      id: this.nextId(appointments.map((item) => item.id)),
      fullName,
      phone,
      email,
      major,
      cycle,
      status: 'Registrada',
      createdAt: new Date().toISOString(),
      slotId: slot.id,
      slotDate: slot.date,
      slotStartTime: slot.startTime,
      slotEndTime: slot.endTime,
    };

    this.writeLocalSlots(slots);
    this.writeLocalAppointments([...appointments, appointment]);
    return appointment;
  }

  private getLocalAppointments(): InterviewAppointmentRecord[] {
    return this.readLocalAppointments().sort((left, right) => {
      const leftValue = `${left.slotDate} ${left.slotStartTime}`;
      const rightValue = `${right.slotDate} ${right.slotStartTime}`;
      return rightValue.localeCompare(leftValue);
    });
  }

  private removeLocalAppointment(id: number): void {
    const appointments = this.readLocalAppointments();
    const appointment = appointments.find((item) => item.id === id);

    if (!appointment) {
      throw this.localError('No se encontro la cita seleccionada.', 404);
    }

    const slots = this.readLocalSlots();
    const slotIndex = slots.findIndex((item) => item.id === appointment.slotId);

    if (slotIndex >= 0) {
      const slot = slots[slotIndex];
      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      slot.available = slot.bookedCount < slot.capacity;
      this.writeLocalSlots(slots);
    }

    this.writeLocalAppointments(appointments.filter((item) => item.id !== id));
  }

  private markLocalAppointmentAsAttended(id: number): InterviewAppointmentRecord {
    const appointments = this.readLocalAppointments();
    const appointmentIndex = appointments.findIndex((item) => item.id === id);

    if (appointmentIndex < 0) {
      throw this.localError('No se encontro la cita seleccionada.', 404);
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      status: 'Atendida',
    };

    this.writeLocalAppointments(appointments);
    return appointments[appointmentIndex];
  }

  private readLocalSlots(): StoredInterviewSlot[] {
    return this.readLocalCollection(this.localSlotsStorageKey)
      .map((item) => this.toStoredSlot(item))
      .filter((item): item is StoredInterviewSlot => item !== null);
  }

  private writeLocalSlots(slots: StoredInterviewSlot[]): void {
    this.writeLocalCollection(this.localSlotsStorageKey, slots);
  }

  private readLocalAppointments(): StoredInterviewAppointment[] {
    return this.readLocalCollection(this.localAppointmentsStorageKey)
      .map((item) => this.toStoredAppointment(item))
      .filter((item): item is StoredInterviewAppointment => item !== null);
  }

  private writeLocalAppointments(appointments: StoredInterviewAppointment[]): void {
    this.writeLocalCollection(this.localAppointmentsStorageKey, appointments);
  }

  private readLocalCollection(storageKey: string): unknown[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeLocalCollection(storageKey: string, value: unknown[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  private toStoredSlot(payload: unknown): StoredInterviewSlot | null {
    const slot = this.mapSlot(payload);

    if (
      slot.id === undefined
      || !slot.date
      || !slot.startTime
      || !slot.endTime
      || slot.capacity === undefined
      || slot.bookedCount === undefined
      || slot.available === undefined
    ) {
      return null;
    }

    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      available: slot.available,
    };
  }

  private toStoredAppointment(payload: unknown): StoredInterviewAppointment | null {
    const appointment = this.mapAppointment(payload);

    if (
      appointment.id === undefined
      || !appointment.fullName
      || !appointment.phone
      || !appointment.email
      || !appointment.major
      || !appointment.cycle
      || !appointment.status
      || !appointment.createdAt
      || appointment.slotId === undefined
      || !appointment.slotDate
      || !appointment.slotStartTime
      || !appointment.slotEndTime
    ) {
      return null;
    }

    return {
      id: appointment.id,
      fullName: appointment.fullName,
      phone: appointment.phone,
      email: appointment.email,
      major: appointment.major,
      cycle: appointment.cycle,
      status: appointment.status,
      createdAt: appointment.createdAt,
      slotId: appointment.slotId,
      slotDate: appointment.slotDate,
      slotStartTime: appointment.slotStartTime,
      slotEndTime: appointment.slotEndTime,
    };
  }

  private toInterviewSlot(slot: StoredInterviewSlot): InterviewSlot {
    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      available: slot.available,
    };
  }

  private nextId(ids: number[]): number {
    return ids.reduce((max, current) => Math.max(max, current), 0) + 1;
  }

  private localError(message: string, status = 400): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      error: { message },
    });
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

  private asBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return undefined;
  }
}
