import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Director {
  nombre: string;
  cargo: string;
  area: string;
  correo: string;
  foto: string;
}

export const DIRECTORIO_FAKE: Director[] = [
  {
    nombre: 'Dr. Alejandro Rivas Montes',
    cargo: 'Director General',
    area: 'Dirección Institucional',
    correo: 'arivas@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Mg. Valeria Quiroz Salazar',
    cargo: 'Subdirectora Académica',
    area: 'Gestión Académica',
    correo: 'vquiroz@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Dr. Sebastián Luján Torres',
    cargo: 'Coordinador de Investigación',
    area: 'Investigación Científica',
    correo: 'slujan@geourp.edu.pe',
     foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Lic. Mariana Ponce Ríos',
    cargo: 'Coordinadora de Eventos',
    area: 'Extensión Universitaria',
    correo: 'mponce@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Lic. Andrés Vega Huamán',
    cargo: 'Responsable de Biblioteca',
    area: 'Gestión Documental',
    correo: 'avega@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Mg. Camila Ortega León',
    cargo: 'Coordinadora de Miembros',
    area: 'Gestión de Comunidad',
    correo: 'cortega@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Srta. Daniela Cruz Medina',
    cargo: 'Secretaría Administrativa',
    area: 'Administración',
    correo: 'dcruz@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  },
  {
    nombre: 'Dr. Ricardo Salinas Prado',
    cargo: 'Asesor Académico',
    area: 'Consejo Consultivo',
    correo: 'rsalinas@geourp.edu.pe',
    foto: '/directorio/foto.jpg'
  }
];

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio {

  directores: Director[] = DIRECTORIO_FAKE;

}
