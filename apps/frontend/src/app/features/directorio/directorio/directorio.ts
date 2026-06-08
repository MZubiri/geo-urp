import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { BoardMember, BoardMembersService } from '../../../core/board-members/board-members.service';
import { API_BASE_URL } from '../../../core/config/api.config';

@Component({
  selector: 'app-directorio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio implements OnInit {
  private readonly presidentaEmail = '201521216@urp.edu.pe';

  miembros: BoardMember[] = [];
  cargando = false;
  error = '';

  constructor(
    private boardMembersService: BoardMembersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarMiembros();
  }

  cargarMiembros(): void {
    this.cargando = true;
    this.error = '';

    this.boardMembersService
      .getPublic()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.miembros = this.extractData(response)
            .map((item) => this.mapMember(item))
            .filter((item): item is BoardMember => !!item)
            .filter((item) => item.isActive !== false)
            .filter((item) => this.isShownInDirectory(item))
            .sort((left, right) => this.sortMembers(left, right));

          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  getPhotoSrc(member: BoardMember): string {
    const raw = (member.photoUrl ?? member.imageUrl ?? '').trim();
    if (!raw) {
      return '/directorio/foto.jpg';
    }

    if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) {
      return raw;
    }

    if (raw.startsWith('/')) {
      return `${API_BASE_URL}${raw}`;
    }

    if (/^[\w.-]+\.[a-z]{2,}/i.test(raw)) {
      return `https://${raw}`;
    }

    return `${API_BASE_URL}/${raw.replace(/^\/+/, '')}`;
  }

  getDisplayPosition(member: BoardMember): string {
    if (this.isVisualPresident(member)) {
      return 'Presidenta';
    }

    return member.position ?? member.roleName ?? 'Director(a)';
  }

  private extractData(response: unknown): unknown[] {
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

    if (this.isRecord(data) && Array.isArray(data['items'])) {
      return data['items'];
    }

    if (this.isRecord(data) && Array.isArray(data['$values'])) {
      return data['$values'];
    }

    return [];
  }

  private mapMember(payload: unknown): BoardMember | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    return {
      id: this.asNumber(payload['id']),
      fullName: this.asString(payload['fullName']) ?? this.asString(payload['name']),
      name: this.asString(payload['name']) ?? this.asString(payload['fullName']),
      position: this.asString(payload['position']) ?? this.asString(payload['roleName']) ?? this.asString(payload['role']),
      roleName: this.asString(payload['roleName']) ?? this.asString(payload['position']),
      role: this.asString(payload['role']) ?? this.asString(payload['position']),
      bio: this.asString(payload['bio']) ?? this.asString(payload['specialty']),
      specialty: this.asString(payload['specialty']) ?? this.asString(payload['bio']),
      email: this.asString(payload['email']),
      photoUrl: this.asString(payload['photoUrl']) ?? this.asString(payload['imageUrl']),
      imageUrl: this.asString(payload['imageUrl']) ?? this.asString(payload['photoUrl']),
      sortOrder: this.asNumber(payload['sortOrder']) ?? 0,
      order: this.asNumber(payload['order']) ?? this.asNumber(payload['sortOrder']) ?? 0,
      isActive: this.asBoolean(payload['isActive']) ?? true,
    };
  }

  private isShownInDirectory(member: BoardMember): boolean {
    return this.getOrder(member) === 1;
  }

  private isVisualPresident(member: BoardMember): boolean {
    return (member.email ?? '').trim().toLowerCase() === this.presidentaEmail;
  }

  private sortMembers(left: BoardMember, right: BoardMember): number {
    const leftRank = this.isShownInDirectory(left) && this.isVisualPresident(left) ? 0 : 1;
    const rightRank = this.isShownInDirectory(right) && this.isVisualPresident(right) ? 0 : 1;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const orderDiff = this.getOrder(left) - this.getOrder(right);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return (left.fullName ?? left.name ?? '').localeCompare(right.fullName ?? right.name ?? '');
  }

  private getOrder(member: BoardMember): number {
    return member.order ?? member.sortOrder ?? 0;
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

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error) {
      if (this.looksLikeHtml(error.error)) {
        return 'El servidor web esta devolviendo HTML en /api. Configura el proxy de /api hacia la API.';
      }

      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    if (error.status) {
      return `No se pudo cargar directorio (HTTP ${error.status}).`;
    }

    return 'No se pudo cargar directorio.';
  }

  private looksLikeHtml(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
  }
}
