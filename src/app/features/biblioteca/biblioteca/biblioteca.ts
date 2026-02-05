import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ===== MODELOS ===== */
export interface Investigacion {
  titulo: string;
  autores: string;
  anio: number;
  area: string;
  archivo: string;
}

export interface Examen {
  curso: string;
  tipo: 'Parcial' | 'Final' | 'Práctica';
  anio: number;
  archivo: string;
}

export interface Libro {
  titulo: string;
  autor: string;
  area: string;
}

/* ===== DATA FAKE ===== */

// 🧪 Investigaciones
const INVESTIGACIONES_FAKE: Investigacion[] = [
  {
    titulo: 'Análisis Sismológico de la Costa Central del Perú',
    autores: 'Departamento de Investigación GEO-URP',
    anio: 2024,
    area: 'Sismología',
    archivo: 'biblioteca/a.pdf'
  },
  {
    titulo: 'Procesos Geológicos en Zonas Costeras del Sur',
    autores: 'Equipo de Investigación GEO-URP',
    anio: 2023,
    area: 'Geología Costera',
    archivo: 'biblioteca/divina-comedia.pdf'
  },
  {
    titulo: 'Evaluación de Acuíferos en la Cuenca de Lima',
    autores: 'Área de Hidrogeología GEO-URP',
    anio: 2022,
    area: 'Hidrogeología',
    archivo: 'biblioteca/orgullo_y_prejuicio.pdf'
  }
];

// 📝 Exámenes
const EXAMENES_FAKE: Examen[] = [
  {
    curso: 'Mecánica de Suelos I',
    tipo: 'Parcial',
    anio: 2023,
    archivo: 'biblioteca/examenes/ms1-parcial-2023.pdf'
  },
  {
    curso: 'Geología General',
    tipo: 'Final',
    anio: 2022,
    archivo: 'biblioteca/examenes/geologia-final-2022.pdf'
  },
  {
    curso: 'Ingeniería Geotécnica',
    tipo: 'Práctica',
    anio: 2024,
    archivo: 'biblioteca/examenes/geotecnia-practica-2024.pdf'
  }
];

// 📦 Libros
const LIBROS_FAKE: Libro[] = [
  {
    titulo: 'Mecánica de Suelos',
    autor: 'Karl Terzaghi',
    area: 'Geotecnia'
  },
  {
    titulo: 'Ingeniería de Cimentaciones',
    autor: 'Braja M. Das',
    area: 'Geotecnia'
  },
  {
    titulo: 'Estabilidad de Taludes',
    autor: 'Duncan & Wright',
    area: 'Geotecnia'
  }
];

/* ===== COMPONENTE ===== */
@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.css',
})
export class Biblioteca implements OnInit {

  /* ================= DATA ================= */
  investigaciones: Investigacion[] = INVESTIGACIONES_FAKE;
  examenes: Examen[] = EXAMENES_FAKE;
  libros: Libro[] = LIBROS_FAKE;

  /* ============== NAVEGACIÓN ============== */
  seccionActiva: 'investigaciones' | 'examenes' | 'libros' = 'investigaciones';

  /* ========== FILTROS INVESTIGACIONES ===== */
  areas: string[] = [];
  anios: number[] = [];
  filtroArea = 'Todas';
  filtroAnio: number | 'Todos' = 'Todos';
  busqueda = '';

  /* ============= FILTROS EXÁMENES ========= */
  busquedaExamen = '';
  filtroTipoExamen: 'Todos' | 'Parcial' | 'Final' | 'Práctica' = 'Todos';
  filtroAnioExamen: number | 'Todos' = 'Todos';

  /* =============== FILTROS LIBROS ========= */
  busquedaLibro = '';
  filtroAreaLibro = 'Todas';
  areasLibros: string[] = [];

  ngOnInit(): void {
    /* áreas y años investigaciones */
    this.areas = ['Todas', ...Array.from(
      new Set(this.investigaciones.map(i => i.area))
    )];

    this.anios = Array.from(
      new Set(this.investigaciones.map(i => i.anio))
    ).sort((a, b) => b - a);

    /* áreas libros */
    this.areasLibros = ['Todas', ...Array.from(
      new Set(this.libros.map(l => l.area))
    )];
  }

  /* ===== INVESTIGACIONES FILTRADAS ===== */
  get investigacionesFiltradas(): Investigacion[] {
    return this.investigaciones.filter(i => {
      const porArea =
        this.filtroArea === 'Todas' || i.area === this.filtroArea;

      const porAnio =
        this.filtroAnio === 'Todos' || i.anio === this.filtroAnio;

      const porTitulo =
        i.titulo.toLowerCase().includes(this.busqueda.toLowerCase());

      return porArea && porAnio && porTitulo;
    });
  }

  /* ===== EXÁMENES FILTRADOS ===== */
  get examenesFiltrados(): Examen[] {
    return this.examenes.filter(e => {
      const porTexto =
        e.curso.toLowerCase().includes(this.busquedaExamen.toLowerCase());

      const porTipo =
        this.filtroTipoExamen === 'Todos' || e.tipo === this.filtroTipoExamen;

      const porAnio =
        this.filtroAnioExamen === 'Todos' || e.anio === this.filtroAnioExamen;

      return porTexto && porTipo && porAnio;
    });
  }

  /* ===== LIBROS FILTRADOS ===== */
  get librosFiltrados(): Libro[] {
    return this.libros.filter(l => {
      const porTexto =
        l.titulo.toLowerCase().includes(this.busquedaLibro.toLowerCase()) ||
        l.autor.toLowerCase().includes(this.busquedaLibro.toLowerCase());

      const porArea =
        this.filtroAreaLibro === 'Todas' || l.area === this.filtroAreaLibro;

      return porTexto && porArea;
    });
  }

  /* ===== SOLICITUD DE LIBRO ===== */
  solicitarLibro(libro: Libro): void {
    alert(`📦 Solicitud enviada:\n\n${libro.titulo}\nAutor: ${libro.autor}`);
    // luego: conectar con Pedidos / backend
  }
}
