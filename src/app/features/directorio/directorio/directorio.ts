import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { BoardMember, BoardMembersService } from '../../../core/board-members/board-members.service';

interface BoardMemberForm {
  fullName: string;
  roleName: string;
  specialty: string;
  email: string;
  imageUrl: string;
}

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio implements OnInit {
  miembros: BoardMember[] = [];
  cargando = false;
  error = '';
  guardando = false;
  editandoId: number | null = null;

  form: BoardMemberForm = {
    fullName: '',
    roleName: '',
    specialty: '',
    email: '',
    imageUrl: '',
  };

  constructor(
    private boardMembersService: BoardMembersService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarMiembros();
  }

  cargarMiembros(): void {
    this.cargando = true;
    this.error = '';

    this.boardMembersService
      .getPublic()
      .pipe(timeout(10000), finalize(() => (this.cargando = false)))
      .subscribe({
        next: (response) => {
          this.miembros = this.normalizeMembers(response);
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
        },
      });
  }

  editar(member: BoardMember): void {
    this.editandoId = member.id ?? null;
    this.form = {
      fullName: member.fullName ?? member.name ?? '',
      roleName: member.roleName ?? member.role ?? '',
      specialty: member.specialty ?? '',
      email: member.email ?? '',
      imageUrl: member.imageUrl ?? member.photoUrl ?? '',
    };
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.resetForm();
  }

  guardar(): void {
    if (!this.authService.isAdmin()) {
      return;
    }

    const payload: BoardMember = {
      fullName: this.form.fullName,
      roleName: this.form.roleName,
      specialty: this.form.specialty,
      email: this.form.email,
      imageUrl: this.form.imageUrl,
    };

    this.guardando = true;
    const request = this.editandoId
      ? this.boardMembersService.update(this.editandoId, payload)
      : this.boardMembersService.create(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicion();
        this.cargarMiembros();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.getErrorMessage(error);
      },
    });
  }

  eliminar(member: BoardMember): void {
    if (!this.authService.isAdmin() || !member.id) {
      return;
    }

    this.guardando = true;
    this.boardMembersService.remove(member.id).subscribe({
      next: () => {
        this.guardando = false;
        this.cargarMiembros();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.getErrorMessage(error);
      },
    });
  }

  private resetForm(): void {
    this.form = {
      fullName: '',
      roleName: '',
      specialty: '',
      email: '',
      imageUrl: '',
    };
  }

  private normalizeMembers(response: unknown): BoardMember[] {
    return this.extractArray(response) as BoardMember[];
  }

  private extractArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!this.isRecord(payload)) {
      return [];
    }

    const directKeys = ['data', 'items', 'results', 'value', 'content'];

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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (error.status) {
      return `No se pudo completar la operación en directorio (HTTP ${error.status}).`;
    }

    return 'No se pudo completar la operación en directorio.';
  }
}
