import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ===== MODELO ===== */
export interface Miembro {
  codigo: string;
  nombre: string;
  carrera: string;
  unidoDesde: string;
  correo: string;
  telefono: string;
}

/* ===== DATA FAKE ===== */
const MIEMBROS_FAKE: Miembro[] = [
  {
    codigo: 'GEO-001',
    nombre: 'Ana Lucía Ramos',
    carrera: 'Ingeniería Geológica',
    unidoDesde: '2023-03-15',
    correo: 'anaramos@urp.edu.pe',
    telefono: '999 123 456'
  },
  {
    codigo: 'GEO-002',
    nombre: 'Carlos Mendoza',
    carrera: 'Ingeniería Geotécnica',
    unidoDesde: '2022-08-10',
    correo: 'cmendoza@urp.edu.pe',
    telefono: '988 456 321'
  },
  {
    codigo: 'GEO-003',
    nombre: 'Valeria Quiroz',
    carrera: 'Ingeniería Ambiental',
    unidoDesde: '2024-01-20',
    correo: 'vquiroz@urp.edu.pe',
    telefono: '977 654 888'
  }
];

@Component({
  selector: 'app-miembros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './miembros.html',
  styleUrl: './miembros.css',
})
export class Miembros {

  miembros: Miembro[] = [...MIEMBROS_FAKE];

  /* ===== FILTROS ===== */
  busqueda = '';
  filtroCarrera = 'Todas';
  carreras: string[] = ['Todas', ...Array.from(new Set(
    MIEMBROS_FAKE.map(m => m.carrera)
  ))];

  get miembrosFiltrados(): Miembro[] {
    return this.miembros.filter(m => {
      const porTexto =
        m.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        m.codigo.toLowerCase().includes(this.busqueda.toLowerCase());

      const porCarrera =
        this.filtroCarrera === 'Todas' || m.carrera === this.filtroCarrera;

      return porTexto && porCarrera;
    });
  }

  /* ===== MODALES ===== */
  modalContacto = false;
  modalForm = false;
  modalEliminar = false;

  miembroSeleccionado: Miembro | null = null;
  modoForm: 'crear' | 'editar' = 'crear';

  /* ===== ACCIONES ===== */
  abrirContacto(m: Miembro) {
    this.miembroSeleccionado = m;
    this.modalContacto = true;
  }

  abrirCrear() {
    this.modoForm = 'crear';
    this.miembroSeleccionado = {
      codigo: '',
      nombre: '',
      carrera: '',
      unidoDesde: '',
      correo: '',
      telefono: ''
    };
    this.modalForm = true;
  }

  abrirEditar(m: Miembro) {
    this.modoForm = 'editar';
    this.miembroSeleccionado = { ...m };
    this.modalForm = true;
  }

  guardar() {
    if (!this.miembroSeleccionado) return;

    if (this.modoForm === 'crear') {
      this.miembros.push(this.miembroSeleccionado);
    } else {
      const i = this.miembros.findIndex(m => m.codigo === this.miembroSeleccionado!.codigo);
      if (i !== -1) this.miembros[i] = this.miembroSeleccionado;
    }

    this.cerrarModales();
  }

  abrirEliminar(m: Miembro) {
    this.miembroSeleccionado = m;
    this.modalEliminar = true;
  }

  confirmarEliminar() {
    this.miembros = this.miembros.filter(m => m !== this.miembroSeleccionado);
    this.cerrarModales();
  }

  cerrarModales() {
    this.modalContacto = false;
    this.modalForm = false;
    this.modalEliminar = false;
    this.miembroSeleccionado = null;
  }
}
