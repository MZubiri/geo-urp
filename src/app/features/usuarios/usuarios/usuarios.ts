import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ===== MODELO ===== */
export interface Usuario {
  codigo: string;
  nombre: string;
  correo: string;
  departamento: string;
  rol: 'Admin' | 'Editor' | 'Consulta';
  estado: 'Activo' | 'Inactivo';
}

/* ===== DATA FAKE ===== */
const USUARIOS_FAKE: Usuario[] = [
  {
    codigo: 'USR-001',
    nombre: 'Camila Herrera',
    correo: 'cherrera@urp.edu.pe',
    departamento: 'Investigación',
    rol: 'Admin',
    estado: 'Activo'
  },
  {
    codigo: 'USR-002',
    nombre: 'Luis Paredes',
    correo: 'lparedes@urp.edu.pe',
    departamento: 'Biblioteca',
    rol: 'Editor',
    estado: 'Activo'
  },
  {
    codigo: 'USR-003',
    nombre: 'Andrea Salas',
    correo: 'asalas@urp.edu.pe',
    departamento: 'Eventos',
    rol: 'Consulta',
    estado: 'Inactivo'
  }
];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {

  /* ===== DATA ===== */
  usuarios: Usuario[] = [...USUARIOS_FAKE];
  usuariosFiltrados: Usuario[] = [];

  /* ===== FILTROS ===== */
  busqueda = '';
  filtroDepartamento = 'Todos';
  filtroRol = 'Todos';

  departamentos = ['Todos', 'Investigación', 'Biblioteca', 'Eventos'];
  roles = ['Todos', 'Admin', 'Editor', 'Consulta'];

  /* ===== MODALES ===== */
  modalForm = false;
  modalPassword = false;
  modalEliminar = false;

  usuarioSeleccionado: Usuario | null = null;
  nuevaPassword = '';

  constructor() {
    // inicializar lista visible
    this.filtrarUsuarios();
  }

  /* ===== FILTRADO ESTABLE ===== */
  filtrarUsuarios(): void {
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const porTexto =
        u.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        u.codigo.toLowerCase().includes(this.busqueda.toLowerCase());

      const porDepto =
        this.filtroDepartamento === 'Todos' ||
        u.departamento === this.filtroDepartamento;

      const porRol =
        this.filtroRol === 'Todos' ||
        u.rol === this.filtroRol;

      return porTexto && porDepto && porRol;
    });
  }

  /* ===== MODALES ===== */
  editar(u: Usuario): void {
    this.usuarioSeleccionado = { ...u }; // copia segura
    this.modalForm = true;
  }

  cambiarPassword(u: Usuario): void {
    this.usuarioSeleccionado = { ...u }; // copia segura
    this.nuevaPassword = '';
    this.modalPassword = true;
  }

  eliminar(u: Usuario): void {
    this.usuarioSeleccionado = { ...u }; // copia segura
    this.modalEliminar = true;
  }

  /* ===== ACCIONES ===== */
  guardar(): void {
    if (!this.usuarioSeleccionado) return;

    const index = this.usuarios.findIndex(
      u => u.codigo === this.usuarioSeleccionado!.codigo
    );

    if (index !== -1) {
      this.usuarios[index] = { ...this.usuarioSeleccionado };
    }

    this.cerrar();
    this.filtrarUsuarios();
  }

  confirmarEliminar(): void {
    if (!this.usuarioSeleccionado) return;

    this.usuarios = this.usuarios.filter(
      u => u.codigo !== this.usuarioSeleccionado!.codigo
    );

    this.cerrar();
    this.filtrarUsuarios();
  }

guardarPassword(): void {
  if (!this.usuarioSeleccionado) return;

  console.log(
    `Contraseña cambiada para ${this.usuarioSeleccionado.correo}`
  );

  this.cerrar();

  // ⏱️ esperar a que Angular estabilice el DOM
  setTimeout(() => {
    this.filtrarUsuarios();
  });
}


  cerrar(): void {
    this.modalForm = false;
    this.modalPassword = false;
    this.modalEliminar = false;
    this.usuarioSeleccionado = null;
    this.nuevaPassword = '';
  }

  /* ===== TRACK BY ===== */
  trackByCodigo(_: number, u: Usuario): string {
    return u.codigo;
  }
}
