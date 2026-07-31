import { Injectable } from '@angular/core';
import { Actividad } from '../models/coneic.models';

@Injectable({
  providedIn: 'root'
})
export class IcsService {

  downloadIcs(actividad: Actividad): void {
    const startDate = this.formatDateToIcs(actividad.horaInicio);
    const endDate = this.formatDateToIcs(actividad.horaFin);
    const summary = actividad.nombre;
    const description = `${actividad.descripcion || ''}\n\nApartado: ${actividad.apartadoNombre || ''}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CONEIC Cusco 2026//Plataforma de Cronogramas//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:coneic-${actividad.id}-${Date.now()}@coneic.org`,
      `DTSTAMP:${this.formatDateToIcs(new Date().toISOString())}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      'LOCATION:Cusco, Perú - Evento CONEIC 2026',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${this.slugify(actividad.nombre)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadAllIcs(actividades: Actividad[], fileName: string = 'Mi-Agenda-Completa-CONEIC-2026'): void {
    if (!actividades || actividades.length === 0) return;

    const eventsList = actividades.map(act => {
      const startDate = this.formatDateToIcs(act.horaInicio);
      const endDate = this.formatDateToIcs(act.horaFin);
      const summary = act.nombre;
      const description = `${act.descripcion || ''}\n\nApartado: ${act.apartadoNombre || ''}`;

      return [
        'BEGIN:VEVENT',
        `UID:coneic-${act.id}-${Date.now()}@coneic.org`,
        `DTSTAMP:${this.formatDateToIcs(new Date().toISOString())}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'LOCATION:Cusco, Perú - Evento CONEIC 2026',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CONEIC Cusco 2026//Agenda Completa//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      eventsList,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private formatDateToIcs(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  }

  private slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}
