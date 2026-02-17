import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

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

    this.boardMembersService.getPublic().subscribe({
      next: (response) => {
        this.cargando = false;
        this.miembros = this.normalizeMembers(response);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
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
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isRecord(response) && Array.isArray(response['data'])) {
      return response['data'] as BoardMember[];
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

    return 'No se pudo completar la operación en directorio.';
  }
}
