import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { LibraryService, Research, Exam, Book, LibraryCategory } from '../../../core/library/library.service';
import { API_BASE_URL } from '../../../core/config/api.config';

export interface Investigacion {
  id?: number;
  titulo: string;
  autores: string;
  anio: number;
  area: string;
  archivo: string;
  categoryId?: number;
}

export interface Examen {
  id?: number;
  curso: string;
  tipo: 'Parcial' | 'Final' | 'Practica';
  anio: number;
  archivo: string;
  descripcion?: string;
  fecha?: string;
  categoryId?: number;
}

export interface Libro {
  id?: number;
  titulo: string;
  autor: string;
  area: string;
  editorial?: string;
  anio?: number;
  archivo?: string;
  categoryId?: number;
}

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.css',
})
export class Biblioteca implements OnInit {
  investigaciones: Investigacion[] = [];
  examenes: Examen[] = [];
  libros: Libro[] = [];

  researchCategories: LibraryCategory[] = [];
  examCategories: LibraryCategory[] = [];
  bookCategories: LibraryCategory[] = [];

  cargando = false;
  guardando = false;
  error = '';
  solicitudMensaje = '';

  seccionActiva: 'investigaciones' | 'examenes' | 'libros' = 'investigaciones';

  editandoResearchId: number | null = null;
  formResearch = { titulo: '', autores: '', anio: new Date().getFullYear(), archivo: '', categoryId: null as number | null };
  subiendoResearchArchivo = false;
  researchArchivoNombre = '';

  editandoExamId: number | null = null;
  formExam = {
    curso: '',
    descripcion: '',
    anio: new Date().getFullYear(),
    archivo: '',
    categoryId: null as number | null,
  };
  subiendoExamArchivo = false;
  examArchivoNombre = '';

  editandoBookId: number | null = null;
  formBook = {
    titulo: '',
    autor: '',
    editorial: '',
    anio: new Date().getFullYear(),
    archivo: '',
    categoryId: null as number | null,
  };

  areas: string[] = [];
  anios: number[] = [];
  filtroArea = 'Todas';
  filtroAnio: number | 'Todos' = 'Todos';
  busqueda = '';

  busquedaExamen = '';
  filtroTipoExamen: 'Todos' | 'Parcial' | 'Final' | 'Practica' = 'Todos';
  filtroAnioExamen: number | 'Todos' = 'Todos';
  aniosExamenes: number[] = [];

  busquedaLibro = '';
  filtroAreaLibro = 'Todas';
  areasLibros: string[] = [];

  constructor(
    private libraryService: LibraryService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    let pending = 6;
    const done = (): void => {
      pending -= 1;
      if (pending <= 0) {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };

    this.libraryService
      .getResearch()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        const researchData = this.extractData(response);
        this.investigaciones = researchData.map((r: Research) => this.mapResearch(r));
        this.actualizarFiltrosInvestigaciones();
        this.cdr.detectChanges();
      });

    this.libraryService
      .getExams()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        const examData = this.extractData(response);
        this.examenes = examData.map((e: Exam) => this.mapExam(e));
        this.actualizarFiltrosExamenes();
        this.cdr.detectChanges();
      });

    this.libraryService
      .getBooks()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        const bookData = this.extractData(response);
        this.libros = bookData.map((b: Book) => this.mapBook(b));
        this.actualizarFiltrosLibros();
        this.cdr.detectChanges();
      });

    this.libraryService
      .getResearchCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        this.researchCategories = this.mapCategories(response);
        this.investigaciones = this.investigaciones.map((item) => ({
          ...item,
          area: this.getCategoryName(item.categoryId, this.researchCategories),
        }));
        this.actualizarFiltrosInvestigaciones();
        this.setDefaultCategoriesIfNeeded();
        this.cdr.detectChanges();
      });

    this.libraryService
      .getExamCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        this.examCategories = this.mapCategories(response);
        this.setDefaultCategoriesIfNeeded();
        this.cdr.detectChanges();
      });

    this.libraryService
      .getBookCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(done))
      .subscribe((response) => {
        this.bookCategories = this.mapCategories(response);
        this.libros = this.libros.map((item) => ({
          ...item,
          area: this.getCategoryName(item.categoryId, this.bookCategories),
        }));
        this.actualizarFiltrosLibros();
        this.setDefaultCategoriesIfNeeded();
        this.cdr.detectChanges();
      });
  }

  private extractData(response: unknown): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!this.isRecord(response)) {
      return [];
    }

    const data = response['data'];
    if (Array.isArray(data)) {
      return data;
    }

    if (this.isRecord(data) && Array.isArray(data['$values'])) {
      return data['$values'];
    }

    if (Array.isArray(response['items'])) {
      return response['items'];
    }

    return [];
  }

  private mapCategories(response: unknown): LibraryCategory[] {
    const data = this.extractData(response);

    return data
      .filter((item) => this.isRecord(item))
      .map((item) => ({
        id: this.asNumber(item['id']),
        name: this.asString(item['name']),
        isActive: this.asBoolean(item['isActive']),
      }))
      .filter((item) => typeof item.id === 'number' && !!item.name && item.isActive !== false);
  }

  private setDefaultCategoriesIfNeeded(): void {
    if (this.formResearch.categoryId === null) {
      this.formResearch.categoryId = this.firstCategoryId(this.researchCategories);
    }
    if (this.formExam.categoryId === null) {
      this.formExam.categoryId = this.firstCategoryId(this.examCategories);
    }
    if (this.formBook.categoryId === null) {
      this.formBook.categoryId = this.firstCategoryId(this.bookCategories);
    }
  }

  private firstCategoryId(categories: LibraryCategory[]): number | null {
    return categories.length > 0 && typeof categories[0].id === 'number' ? categories[0].id : null;
  }

  private mapResearch(r: Research): Investigacion {
    const year = r.publishedAt ? new Date(r.publishedAt).getFullYear() : new Date().getFullYear();

    return {
      id: r.id,
      titulo: r.title ?? '',
      autores: r.summary ?? '',
      anio: year,
      area: this.getCategoryName(r.categoryId, this.researchCategories),
      archivo: r.fileUrl ?? '',
      categoryId: r.categoryId,
    };
  }

  private mapExam(e: Exam): Examen {
    const year = e.date ? new Date(e.date).getFullYear() : new Date().getFullYear();
    const tipo = this.extractExamType(`${e.title ?? ''} ${e.description ?? ''}`);

    return {
      id: e.id,
      curso: e.title ?? '',
      tipo,
      anio: year,
      archivo: e.fileUrl ?? '',
      descripcion: e.description ?? '',
      fecha: e.date,
      categoryId: e.categoryId,
    };
  }

  private mapBook(b: Book): Libro {
    return {
      id: b.id,
      titulo: b.title ?? '',
      autor: b.author ?? '',
      area: this.getCategoryName(b.categoryId, this.bookCategories),
      editorial: b.editorial,
      anio: b.year,
      archivo: b.fileUrl ?? '',
      categoryId: b.categoryId,
    };
  }

  private getCategoryName(categoryId: number | undefined, categories: LibraryCategory[]): string {
    const match = categories.find((c) => c.id === categoryId);
    return match?.name ?? 'General';
  }

  private extractExamType(text: string): 'Parcial' | 'Final' | 'Practica' {
    const lower = text.toLowerCase();
    if (lower.includes('parcial')) return 'Parcial';
    if (lower.includes('final')) return 'Final';
    return 'Practica';
  }

  private actualizarFiltrosInvestigaciones(): void {
    this.areas = ['Todas', ...Array.from(new Set(this.investigaciones.map((i) => i.area)))];

    this.anios = Array.from(new Set(this.investigaciones.map((i) => i.anio))).sort((a, b) => b - a);
  }

  private actualizarFiltrosExamenes(): void {
    this.aniosExamenes = Array.from(new Set(this.examenes.map((e) => e.anio))).sort((a, b) => b - a);
  }

  private actualizarFiltrosLibros(): void {
    this.areasLibros = ['Todas', ...Array.from(new Set(this.libros.map((l) => l.area)))];
  }

  editarResearch(i: Investigacion): void {
    this.editandoResearchId = i.id ?? null;
    this.formResearch = {
      titulo: i.titulo,
      autores: i.autores,
      anio: i.anio,
      archivo: i.archivo,
      categoryId: i.categoryId ?? this.firstCategoryId(this.researchCategories),
    };
    this.researchArchivoNombre = this.extractFileName(i.archivo);
  }

  onResearchFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.isAllowedDocument(file)) {
      this.error = 'Solo se permiten archivos PDF o ZIP.';
      input.value = '';
      return;
    }

    this.error = '';
    this.subiendoResearchArchivo = true;
    this.researchArchivoNombre = '';

    this.libraryService
      .uploadResearchFile(file)
      .pipe(
        finalize(() => {
          this.subiendoResearchArchivo = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          const uploadedPath = this.extractUploadedPath(response);
          if (!uploadedPath) {
            this.error = 'No se pudo obtener la URL del archivo cargado.';
            return;
          }

          this.formResearch.archivo = uploadedPath;
          this.researchArchivoNombre = file.name;
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  guardarResearch(): void {
    if (!this.authService.isAdmin()) return;

    const categoryId = this.formResearch.categoryId ?? this.firstCategoryId(this.researchCategories);
    if (categoryId === null) {
      this.error = 'Selecciona una categoria de investigacion.';
      return;
    }
    if (!this.formResearch.archivo.trim()) {
      this.error = 'Sube un archivo PDF o ZIP antes de guardar.';
      return;
    }

    const payload: Research = {
      title: this.formResearch.titulo,
      summary: this.formResearch.autores,
      fileUrl: this.formResearch.archivo,
      publishedAt: new Date(this.formResearch.anio, 0, 1).toISOString(),
      categoryId,
    };

    this.guardando = true;
    const request = this.editandoResearchId
      ? this.libraryService.updateResearch(this.editandoResearchId, payload)
      : this.libraryService.createResearch(payload);

    request
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cancelarEdicionResearch();
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  eliminarResearch(i: Investigacion): void {
    if (!this.authService.isAdmin() || !i.id) return;
    if (!confirm(`Eliminar "${i.titulo}"?`)) return;

    this.guardando = true;
    this.libraryService
      .removeResearch(i.id)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  cancelarEdicionResearch(): void {
    this.editandoResearchId = null;
    this.subiendoResearchArchivo = false;
    this.researchArchivoNombre = '';
    this.formResearch = {
      titulo: '',
      autores: '',
      anio: new Date().getFullYear(),
      archivo: '',
      categoryId: this.firstCategoryId(this.researchCategories),
    };
  }

  editarExam(e: Examen): void {
    this.editandoExamId = e.id ?? null;
    this.formExam = {
      curso: e.curso,
      descripcion: e.descripcion ?? '',
      anio: e.anio,
      archivo: e.archivo,
      categoryId: e.categoryId ?? this.firstCategoryId(this.examCategories),
    };
    this.examArchivoNombre = this.extractFileName(e.archivo);
  }

  onExamFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.isAllowedDocument(file)) {
      this.error = 'Solo se permiten archivos PDF o ZIP.';
      input.value = '';
      return;
    }

    this.error = '';
    this.subiendoExamArchivo = true;
    this.examArchivoNombre = '';

    this.libraryService
      .uploadExamFile(file)
      .pipe(
        finalize(() => {
          this.subiendoExamArchivo = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          const uploadedPath = this.extractUploadedPath(response);
          if (!uploadedPath) {
            this.error = 'No se pudo obtener la URL del archivo cargado.';
            return;
          }

          this.formExam.archivo = uploadedPath;
          this.examArchivoNombre = file.name;
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  guardarExam(): void {
    if (!this.authService.isAdmin()) return;

    const categoryId = this.formExam.categoryId ?? this.firstCategoryId(this.examCategories);
    if (categoryId === null) {
      this.error = 'Selecciona una categoria de examen.';
      return;
    }
    if (!this.formExam.archivo.trim()) {
      this.error = 'Sube un archivo PDF o ZIP antes de guardar.';
      return;
    }

    const payload: Exam = {
      title: this.formExam.curso,
      description: this.formExam.descripcion,
      fileUrl: this.formExam.archivo,
      date: new Date(this.formExam.anio, 0, 1).toISOString(),
      categoryId,
    };

    this.guardando = true;
    const request = this.editandoExamId
      ? this.libraryService.updateExam(this.editandoExamId, payload)
      : this.libraryService.createExam(payload);

    request
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cancelarEdicionExam();
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  eliminarExam(e: Examen): void {
    if (!this.authService.isAdmin() || !e.id) return;
    if (!confirm(`Eliminar "${e.curso}"?`)) return;

    this.guardando = true;
    this.libraryService
      .removeExam(e.id)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  cancelarEdicionExam(): void {
    this.editandoExamId = null;
    this.subiendoExamArchivo = false;
    this.examArchivoNombre = '';
    this.formExam = {
      curso: '',
      descripcion: '',
      anio: new Date().getFullYear(),
      archivo: '',
      categoryId: this.firstCategoryId(this.examCategories),
    };
  }

  editarBook(l: Libro): void {
    this.editandoBookId = l.id ?? null;
    this.formBook = {
      titulo: l.titulo,
      autor: l.autor,
      editorial: l.editorial ?? '',
      anio: l.anio ?? new Date().getFullYear(),
      archivo: l.archivo ?? '',
      categoryId: l.categoryId ?? this.firstCategoryId(this.bookCategories),
    };
  }

  guardarBook(): void {
    if (!this.authService.isAdmin()) return;

    const categoryId = this.formBook.categoryId ?? this.firstCategoryId(this.bookCategories);
    if (categoryId === null) {
      this.error = 'Selecciona una categoria de libro.';
      return;
    }

    const payload: Book = {
      title: this.formBook.titulo,
      author: this.formBook.autor,
      editorial: this.formBook.editorial,
      year: this.formBook.anio,
      fileUrl: this.formBook.archivo,
      categoryId,
    };

    this.guardando = true;
    const request = this.editandoBookId
      ? this.libraryService.updateBook(this.editandoBookId, payload)
      : this.libraryService.createBook(payload);

    request
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cancelarEdicionBook();
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  eliminarBook(l: Libro): void {
    if (!this.authService.isAdmin() || !l.id) return;
    if (!confirm(`Eliminar "${l.titulo}"?`)) return;

    this.guardando = true;
    this.libraryService
      .removeBook(l.id)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.cargarDatos();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  cancelarEdicionBook(): void {
    this.editandoBookId = null;
    this.formBook = {
      titulo: '',
      autor: '',
      editorial: '',
      anio: new Date().getFullYear(),
      archivo: '',
      categoryId: this.firstCategoryId(this.bookCategories),
    };
  }

  get investigacionesFiltradas(): Investigacion[] {
    return this.investigaciones.filter((i) => {
      const porArea = this.filtroArea === 'Todas' || i.area === this.filtroArea;
      const porAnio = this.filtroAnio === 'Todos' || i.anio === this.filtroAnio;
      const porTitulo = i.titulo.toLowerCase().includes(this.busqueda.toLowerCase());

      return porArea && porAnio && porTitulo;
    });
  }

  get examenesFiltrados(): Examen[] {
    return this.examenes.filter((e) => {
      const porTexto = e.curso.toLowerCase().includes(this.busquedaExamen.toLowerCase());
      const porTipo = this.filtroTipoExamen === 'Todos' || e.tipo === this.filtroTipoExamen;
      const porAnio = this.filtroAnioExamen === 'Todos' || e.anio === this.filtroAnioExamen;

      return porTexto && porTipo && porAnio;
    });
  }

  get librosFiltrados(): Libro[] {
    return this.libros.filter((l) => {
      const porTexto =
        l.titulo.toLowerCase().includes(this.busquedaLibro.toLowerCase())
        || l.autor.toLowerCase().includes(this.busquedaLibro.toLowerCase());

      const porArea = this.filtroAreaLibro === 'Todas' || l.area === this.filtroAreaLibro;

      return porTexto && porArea;
    });
  }

  solicitarLibro(libro: Libro): void {
    this.solicitudMensaje = '';
    this.error = '';

    if (!libro.id) {
      this.error = 'No se puede solicitar este libro porque no tiene ID.';
      return;
    }

    this.guardando = true;
    this.libraryService
      .createBookRequest({ bookId: libro.id })
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.solicitudMensaje = this.extractServerMessage(response) || 'Solicitud enviada correctamente.';
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
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
    return typeof value === 'boolean' ? value : undefined;
  }

  private extractServerMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response.trim();
    }

    if (!this.isRecord(response)) {
      return '';
    }

    const directMessage = this.asString(response['message']);
    if (directMessage?.trim()) {
      return directMessage.trim();
    }

    const data = response['data'];
    if (this.isRecord(data)) {
      const nestedMessage = this.asString(data['message']);
      if (nestedMessage?.trim()) {
        return nestedMessage.trim();
      }
    }

    return '';
  }

  private isAllowedDocument(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf' || ext === 'zip') {
      return true;
    }

    const type = file.type.toLowerCase();
    return type === 'application/pdf'
      || type === 'application/zip'
      || type === 'application/x-zip-compressed';
  }

  private extractUploadedPath(response: unknown): string {
    if (typeof response === 'string') {
      return response.trim();
    }

    if (!this.isRecord(response)) {
      return '';
    }

    const data = response['data'];
    if (typeof data === 'string' && data.trim()) {
      return data.trim();
    }

    if (this.isRecord(data)) {
      const nested =
        this.asString(data['url'])
        ?? this.asString(data['path'])
        ?? this.asString(data['fileUrl'])
        ?? this.asString(data['photoUrl']);
      if (nested?.trim()) {
        return nested.trim();
      }
    }

    const direct =
      this.asString(response['url'])
      ?? this.asString(response['path'])
      ?? this.asString(response['fileUrl'])
      ?? this.asString(response['photoUrl']);

    return direct?.trim() ?? '';
  }

  private extractFileName(pathOrUrl: string | undefined): string {
    const value = (pathOrUrl ?? '').trim();
    if (!value) {
      return '';
    }

    const clean = value.split('?')[0].split('#')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1] || value;
  }

  resolveFileUrl(pathOrUrl: string | undefined): string {
    const value = (pathOrUrl ?? '').trim();
    if (!value) {
      return '';
    }

    const lower = value.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('blob:') || lower.startsWith('data:')) {
      return value;
    }

    if (value.startsWith('/')) {
      return `${API_BASE_URL}${value}`;
    }

    return `${API_BASE_URL}/${value}`;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      const text = error.error.trim();
      if (text.startsWith('<!DOCTYPE html') || text.startsWith('<html')) {
        return 'La API devolvio HTML en lugar de JSON. Revisa el proxy/reverse proxy de /api.';
      }
      return text;
    }
    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }
    if (error.status) {
      return `No se pudo completar la operacion (HTTP ${error.status}).`;
    }
    return 'No se pudo completar la operacion.';
  }
}
