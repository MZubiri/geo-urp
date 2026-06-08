import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { LibraryCategory, LibraryService } from '../../../core/library/library.service';

@Component({
  selector: 'app-biblioteca-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './biblioteca-categorias.html',
  styleUrl: './biblioteca-categorias.css',
})
export class BibliotecaCategorias implements OnInit {
  seccionActiva: 'research' | 'exam' | 'book' = 'research';

  researchCategories: LibraryCategory[] = [];
  examCategories: LibraryCategory[] = [];
  bookCategories: LibraryCategory[] = [];

  nuevaResearch = '';
  nuevaExam = '';
  nuevaBook = '';

  editResearchId: number | null = null;
  editExamId: number | null = null;
  editBookId: number | null = null;

  editResearchName = '';
  editExamName = '';
  editBookName = '';

  cargando = false;
  guardando = false;
  error = '';

  constructor(
    private libraryService: LibraryService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (!this.authService.isAdmin()) {
      this.error = 'No autorizado para gestionar categorias.';
      return;
    }

    this.error = '';
    this.cargando = true;

    let pending = 3;
    const done = (): void => {
      pending -= 1;
      if (pending <= 0) {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };

    this.cargarResearch(done);
    this.cargarExam(done);
    this.cargarBook(done);
  }

  private cargarResearch(done?: () => void): void {
    this.libraryService
      .getResearchCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(() => done?.()))
      .subscribe((response) => {
        this.researchCategories = this.mapCategories(response);
        this.cdr.detectChanges();
      });
  }

  private cargarExam(done?: () => void): void {
    this.libraryService
      .getExamCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(() => done?.()))
      .subscribe((response) => {
        this.examCategories = this.mapCategories(response);
        this.cdr.detectChanges();
      });
  }

  private cargarBook(done?: () => void): void {
    this.libraryService
      .getBookCategories()
      .pipe(timeout(10000), catchError(() => of([])), finalize(() => done?.()))
      .subscribe((response) => {
        this.bookCategories = this.mapCategories(response);
        this.cdr.detectChanges();
      });
  }

  crearResearch(): void {
    const name = this.nuevaResearch.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.createResearchCategory({ name }).subscribe({
      next: () => {
        this.guardando = false;
        this.nuevaResearch = '';
        this.cargarResearch();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo crear la categoria de investigacion.';
      },
    });
  }

  crearExam(): void {
    const name = this.nuevaExam.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.createExamCategory({ name }).subscribe({
      next: () => {
        this.guardando = false;
        this.nuevaExam = '';
        this.cargarExam();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo crear la categoria de examen.';
      },
    });
  }

  crearBook(): void {
    const name = this.nuevaBook.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.createBookCategory({ name }).subscribe({
      next: () => {
        this.guardando = false;
        this.nuevaBook = '';
        this.cargarBook();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo crear la categoria de libro.';
      },
    });
  }

  iniciarEdicionResearch(item: LibraryCategory): void {
    this.editResearchId = item.id ?? null;
    this.editResearchName = item.name ?? '';
  }

  iniciarEdicionExam(item: LibraryCategory): void {
    this.editExamId = item.id ?? null;
    this.editExamName = item.name ?? '';
  }

  iniciarEdicionBook(item: LibraryCategory): void {
    this.editBookId = item.id ?? null;
    this.editBookName = item.name ?? '';
  }

  guardarEdicionResearch(): void {
    if (!this.editResearchId) return;

    const name = this.editResearchName.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.updateResearchCategory(this.editResearchId, { id: this.editResearchId, name }).subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicionResearch();
        this.cargarResearch();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo actualizar la categoria de investigacion.';
      },
    });
  }

  guardarEdicionExam(): void {
    if (!this.editExamId) return;

    const name = this.editExamName.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.updateExamCategory(this.editExamId, { id: this.editExamId, name }).subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicionExam();
        this.cargarExam();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo actualizar la categoria de examen.';
      },
    });
  }

  guardarEdicionBook(): void {
    if (!this.editBookId) return;

    const name = this.editBookName.trim();
    if (!name) return;

    this.guardando = true;
    this.libraryService.updateBookCategory(this.editBookId, { id: this.editBookId, name }).subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicionBook();
        this.cargarBook();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo actualizar la categoria de libro.';
      },
    });
  }

  eliminarResearch(item: LibraryCategory): void {
    if (item.id == null) return;
    const id = Number(item.id);
    if (Number.isNaN(id)) return;
    if (!confirm(`Eliminar categoria "${item.name}"?`)) return;

    this.guardando = true;
    this.libraryService.removeResearchCategory(id).subscribe({
      next: () => {
        this.guardando = false;
        this.researchCategories = this.researchCategories.filter((c) => c.id !== id);
        this.cdr.detectChanges();
        this.cargarResearch();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo eliminar la categoria de investigacion.';
      },
    });
  }

  eliminarExam(item: LibraryCategory): void {
    if (item.id == null) return;
    const id = Number(item.id);
    if (Number.isNaN(id)) return;
    if (!confirm(`Eliminar categoria "${item.name}"?`)) return;

    this.guardando = true;
    this.libraryService.removeExamCategory(id).subscribe({
      next: () => {
        this.guardando = false;
        this.examCategories = this.examCategories.filter((c) => c.id !== id);
        this.cdr.detectChanges();
        this.cargarExam();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo eliminar la categoria de examen.';
      },
    });
  }

  eliminarBook(item: LibraryCategory): void {
    if (item.id == null) return;
    const id = Number(item.id);
    if (Number.isNaN(id)) return;
    if (!confirm(`Eliminar categoria "${item.name}"?`)) return;

    this.guardando = true;
    this.libraryService.removeBookCategory(id).subscribe({
      next: () => {
        this.guardando = false;
        this.bookCategories = this.bookCategories.filter((c) => c.id !== id);
        this.cdr.detectChanges();
        this.cargarBook();
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo eliminar la categoria de libro.';
      },
    });
  }

  cancelarEdicionResearch(): void {
    this.editResearchId = null;
    this.editResearchName = '';
  }

  cancelarEdicionExam(): void {
    this.editExamId = null;
    this.editExamName = '';
  }

  cancelarEdicionBook(): void {
    this.editBookId = null;
    this.editBookName = '';
  }

  private mapCategories(response: unknown): LibraryCategory[] {
    const data = this.extractData(response);

    return data
      .filter((item) => this.isRecord(item))
      .map((item) => ({
        id: this.asNumber(item['id'])
          ?? this.asNumber(item['categoryId'])
          ?? this.asNumber(item['researchCategoryId'])
          ?? this.asNumber(item['examCategoryId'])
          ?? this.asNumber(item['bookCategoryId']),
        name: this.asString(item['name']),
        isActive: this.asBoolean(item['isActive']),
      }))
      .filter((item) => typeof item.id === 'number' && !!item.name);
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

    if (this.isRecord(data) && Array.isArray(data['items'])) {
      return data['items'];
    }

    if (Array.isArray(response['$values'])) {
      return response['$values'];
    }

    if (Array.isArray(response['items'])) {
      return response['items'];
    }

    return [];
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
}
