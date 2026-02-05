import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ===== MODELO ===== */
export interface Pedido {
  id: number;
  titulo: string;
  solicitante: string;
  fecha: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

/* ===== DATA FAKE (GEOTÉCNICA) ===== */
const PEDIDOS_FAKE: Pedido[] = [
  {
    id: 1,
    titulo: 'Mecánica de Suelos – Karl Terzaghi y Ralph B. Peck',
    solicitante: 'Luis Ramírez',
    fecha: '2026-01-22',
    estado: 'Pendiente'
  },
  {
    id: 2,
    titulo: 'Ingeniería de Cimentaciones – Braja M. Das',
    solicitante: 'Andrea Salazar',
    fecha: '2026-01-20',
    estado: 'Aprobado'
  },
  {
    id: 3,
    titulo: 'Geotecnia y Cimentaciones Profundas',
    solicitante: 'José Castillo',
    fecha: '2026-01-18',
    estado: 'Pendiente'
  }
];

/* ===== COMPONENTE ===== */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {

  pedidos: Pedido[] = PEDIDOS_FAKE;

  // 🪟 estado del modal
  mostrarModal = false;
  pedidoSeleccionado: Pedido | null = null;
  accion: 'aprobar' | 'rechazar' | null = null;

  abrirModal(p: Pedido, accion: 'aprobar' | 'rechazar'): void {
    this.pedidoSeleccionado = p;
    this.accion = accion;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.pedidoSeleccionado = null;
    this.accion = null;
  }

  confirmarAccion(): void {
    if (!this.pedidoSeleccionado || !this.accion) return;

    if (this.accion === 'aprobar') {
      this.pedidoSeleccionado.estado = 'Aprobado';
    } else {
      this.pedidoSeleccionado.estado = 'Rechazado';
    }

    this.cerrarModal();
  }
}
