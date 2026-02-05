import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ===== MODELO ===== */
export interface Evento {
  titulo: string;
  descripcion: string;
  fechaInicio: string; // ISO
  fechaFin: string;    // ISO
  lugar: string;
  tipo: 'Presencial' | 'Virtual';
}

/* ===== DATA FAKE ===== */
const EVENTOS_FAKE: Evento[] = [
  {
    titulo: 'Seminario de Investigación Geológica',
    descripcion: 'Exposición de proyectos de investigación desarrollados por miembros del GEO-URP.',
    fechaInicio: '2026-02-15T18:00:00',
    fechaFin: '2026-02-15T20:00:00',
    lugar: 'Auditorio URP',
    tipo: 'Presencial'
  },
  {
    titulo: 'Charla: Geología y Cambio Climático',
    descripcion: 'Análisis del impacto geológico en escenarios de cambio climático.',
    fechaInicio: '2026-03-05T19:00:00',
    fechaFin: '2026-03-05T20:30:00',
    lugar: 'Google Meet',
    tipo: 'Virtual'
  },
  {
    titulo: 'Salida de Campo – Zona Costera',
    descripcion: 'Evaluación geológica y recolección de muestras en zona costera.',
    fechaInicio: '2026-03-22T07:00:00',
    fechaFin: '2026-03-22T17:00:00',
    lugar: 'Litoral Sur',
    tipo: 'Presencial'
  },
  {
    titulo: 'Reunión de directorio',
    descripcion: 'Reunión mensual del directorio para planificar actividades y proyectos futuros.',
    fechaInicio: '2026-01-22T07:00:00',
    fechaFin: '2026-01-22T17:00:00',
    lugar: 'Aula Magna URP',
    tipo: 'Presencial'
  }
];

/* ===== COMPONENTE ===== */
@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos {

  eventos = EVENTOS_FAKE.sort(
  (a, b) =>
    new Date(a.fechaInicio).getTime() -
    new Date(b.fechaInicio).getTime()
);


  isPast(e: Evento): boolean {
  return new Date(e.fechaFin) < new Date();
}

isUpcoming(e: Evento): boolean {
  return !this.isPast(e);
}


  googleCalendarLink(e: Evento): string {
    const start = e.fechaInicio.replace(/[-:]/g, '').split('.')[0];
    const end = e.fechaFin.replace(/[-:]/g, '').split('.')[0];

    return (
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(e.titulo)}` +
      `&dates=${start}/${end}` +
      `&details=${encodeURIComponent(e.descripcion)}` +
      `&location=${encodeURIComponent(e.lugar)}`
    );
  }
}
