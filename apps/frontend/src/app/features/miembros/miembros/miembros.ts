import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { BoardMember, BoardMembersService } from '../../../core/board-members/board-members.service';

interface BoardMemberForm {
  fullName: string;
  position: string;
  email: string;
  code: string;
  birthday: string;
  photoUrl: string;
  bio: string;
  isActive: boolean;
  isDirector: boolean;
}

@Component({
  selector: 'app-miembros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './miembros.html',
  styleUrl: './miembros.css',
})
export class Miembros implements OnInit {
  private readonly presidentaEmail = '201521216@urp.edu.pe';

  miembros: BoardMember[] = [];
  cargando = false;
  error = '';
  guardando = false;
  subiendoFoto = false;
  modalCredenciales = false;
  credencialTemporal = '';
  credencialMensaje = '';

  busqueda = '';
  filtroEstado: 'Todos' | 'Activos' | 'Inactivos' = 'Todos';
  filtroTipo: 'Todos' | 'Director' | 'Miembro' = 'Todos';

  modalForm = false;
  modalEliminar = false;
  formSubmitted = false;
  editandoId: number | null = null;
  miembroSeleccionado: BoardMember | null = null;

  form: BoardMemberForm = this.emptyForm();

  constructor(
    public authService: AuthService,
    private boardMembersService: BoardMembersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarMiembros();
  }

  get miembrosFiltrados(): BoardMember[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.miembros.filter((member) => {
      const nombre = (member.fullName ?? member.name ?? '').toLowerCase();
      const cargo = this.getDisplayPosition(member).toLowerCase();
      const correo = (member.email ?? '').toLowerCase();
      const codigo = (member.code ?? '').toLowerCase();

      const porTexto =
        !texto
        || nombre.includes(texto)
        || cargo.includes(texto)
        || correo.includes(texto)
        || codigo.includes(texto);

      const activo = member.isActive !== false;
      const porEstado =
        this.filtroEstado === 'Todos'
        || (this.filtroEstado === 'Activos' && activo)
        || (this.filtroEstado === 'Inactivos' && !activo);

      const isDirector = this.isDirectorMember(member);
      const porTipo =
        this.filtroTipo === 'Todos'
        || (this.filtroTipo === 'Director' && isDirector)
        || (this.filtroTipo === 'Miembro' && !isDirector);

      return porTexto && porEstado && porTipo;
    });
  }

  cargarMiembros(): void {
    this.cargando = true;
    this.error = '';

    const request$ = this.authService.canManageMembers()
      ? this.boardMembersService.getAdmin()
      : this.boardMembersService.getPublic();

    request$
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
            .sort((left, right) => this.sortMembers(left, right));
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error, 'No se pudieron cargar los miembros.');
        },
      });
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.formSubmitted = false;
    this.form = this.emptyForm();
    this.modalForm = true;
  }

  abrirEditar(member: BoardMember): void {
    if (!this.authService.canManageMembers()) {
      return;
    }

    this.editandoId = member.id ?? null;
    this.formSubmitted = false;
    this.form = {
      fullName: member.fullName ?? member.name ?? '',
      position: member.position ?? member.roleName ?? member.role ?? '',
      email: member.email ?? '',
      code: member.code ?? '',
      birthday: member.birthday ?? '',
      photoUrl: member.photoUrl ?? member.imageUrl ?? '',
      bio: member.bio ?? member.specialty ?? '',
      isActive: member.isActive !== false,
      isDirector: this.getOrder(member) === 1,
    };

    this.modalForm = true;
  }

  guardar(): void {
    if (!this.authService.canManageMembers()) {
      return;
    }

    this.formSubmitted = true;
    if (!this.isFormValid()) {
      return;
    }

    const order = this.form.isDirector ? 1 : 0;
    const payload: BoardMember = {
      fullName: this.form.fullName.trim(),
      position: this.form.position.trim(),
      email: this.form.email.trim(),
      code: this.normalizeOptional(this.form.code),
      birthday: this.normalizeOptional(this.form.birthday),
      photoUrl: this.form.photoUrl.trim(),
      bio: this.form.bio.trim(),
      isActive: this.form.isActive,
      sortOrder: order,
      order,
    };

    const creating = !this.editandoId;
    this.guardando = true;
    const request$ = this.editandoId
      ? this.boardMembersService.update(this.editandoId, payload)
      : this.boardMembersService.create(payload);

    request$.subscribe({
      next: (response: unknown) => {
        this.guardando = false;
        this.modalForm = false;
        this.form = this.emptyForm();
        this.cargarMiembros();

        if (creating) {
          this.mostrarCredencialesTemporales(response);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.error = this.getErrorMessage(error, 'No se pudo guardar el miembro.');
      },
    });
  }

  abrirEliminar(member: BoardMember): void {
    if (!this.authService.canManageMembers() || !member.id) {
      return;
    }

    this.miembroSeleccionado = member;
    this.modalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.miembroSeleccionado?.id) {
      return;
    }

    this.guardando = true;
    this.boardMembersService.remove(this.miembroSeleccionado.id).subscribe({
      next: () => {
        this.guardando = false;
        this.modalEliminar = false;
        this.miembroSeleccionado = null;
        this.cargarMiembros();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.modalEliminar = false;
        this.miembroSeleccionado = null;
        this.error = this.getErrorMessage(error, 'No se pudo eliminar el miembro.');
      },
    });
  }

  cerrarModales(): void {
    this.modalForm = false;
    this.modalEliminar = false;
    this.modalCredenciales = false;
    this.form = this.emptyForm();
    this.formSubmitted = false;
    this.editandoId = null;
    this.miembroSeleccionado = null;
    this.credencialTemporal = '';
    this.credencialMensaje = '';
  }

  cerrarCredenciales(): void {
    this.modalCredenciales = false;
    this.credencialTemporal = '';
    this.credencialMensaje = '';
  }

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim());
  }

  isBirthdayValid(): boolean {
    const value = this.form.birthday.trim();
    return !value || /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/.test(value);
  }

  isPhotoUrlValid(): boolean {
    const value = this.form.photoUrl.trim();
    return !!value;
  }

  isFormValid(): boolean {
    return !!this.form.fullName.trim()
      && !!this.form.position.trim()
      && !!this.form.bio.trim()
      && this.isEmailValid()
      && this.isBirthdayValid()
      && this.isPhotoUrlValid()
      && !this.subiendoFoto;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error = 'Selecciona un archivo de imagen valido.';
      return;
    }

    this.subiendoFoto = true;
    this.error = '';

    this.boardMembersService.uploadPhoto(file).subscribe({
      next: (response) => {
        const uploadedPath = this.extractUploadedPath(response);
        if (!uploadedPath) {
          this.error = 'La API no devolvio la ruta de la foto.';
          this.subiendoFoto = false;
          return;
        }

        this.form.photoUrl = uploadedPath;
        this.subiendoFoto = false;
      },
      error: (error: HttpErrorResponse) => {
        this.error = this.getErrorMessage(
          error,
          'No se pudo subir la foto. Verifica que exista el endpoint de upload en la API.',
        );
        this.subiendoFoto = false;
      },
    });
  }

  isDirectorMember(member: BoardMember): boolean {
    return this.getOrder(member) === 1;
  }

  getDisplayType(member: BoardMember): string {
    if (this.isVisualPresident(member)) {
      return 'Presidenta';
    }

    return this.isDirectorMember(member) ? 'Director' : 'Miembro';
  }

  getDisplayPosition(member: BoardMember): string {
    if (this.isVisualPresident(member)) {
      return 'Presidenta';
    }

    return member.position ?? member.roleName ?? member.role ?? '-';
  }

  private emptyForm(): BoardMemberForm {
    return {
      fullName: '',
      position: '',
      email: '',
      code: '',
      birthday: '',
      photoUrl: '',
      bio: '',
      isActive: true,
      isDirector: false,
    };
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
      email: this.asString(payload['email']),
      code: this.asString(payload['code']) ?? null,
      birthday: this.asString(payload['birthday']) ?? null,
      photoUrl: this.asString(payload['photoUrl']) ?? this.asString(payload['imageUrl']),
      imageUrl: this.asString(payload['imageUrl']) ?? this.asString(payload['photoUrl']),
      bio: this.asString(payload['bio']) ?? this.asString(payload['specialty']),
      specialty: this.asString(payload['specialty']) ?? this.asString(payload['bio']),
      sortOrder: this.asNumber(payload['sortOrder']) ?? 0,
      order: this.asNumber(payload['order']) ?? this.asNumber(payload['sortOrder']) ?? 0,
      isActive: this.asBoolean(payload['isActive']) ?? true,
    };
  }

  private extractUploadedPath(response: unknown): string {
    if (typeof response === 'string' && response.trim()) {
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
      const url =
        this.asString(data['url'])
        ?? this.asString(data['path'])
        ?? this.asString(data['photoUrl'])
        ?? this.asString(data['fileUrl']);
      if (url?.trim()) {
        return url.trim();
      }
    }

    const direct =
      this.asString(response['url'])
      ?? this.asString(response['path'])
      ?? this.asString(response['photoUrl'])
      ?? this.asString(response['fileUrl']);

    return direct?.trim() ?? '';
  }

  private mostrarCredencialesTemporales(response: unknown): void {
    const temporal = this.extractTemporaryPassword(response);
    const message = this.extractMessage(response);
    this.credencialTemporal = temporal;
    this.credencialMensaje = this.buildCredentialMessage(message, temporal);
    this.modalCredenciales = true;
    this.cdr.detectChanges();
  }

  private extractTemporaryPassword(response: unknown): string {
    const directPassword = this.extractPasswordFromUnknown(response);
    if (directPassword) {
      return directPassword;
    }

    const message = this.extractMessage(response);
    if (!message) {
      return '';
    }

    const match = message.match(/(?:password|contrasena)\s*(?:temporal)?\s*[:=]\s*([^\s,;.]+)/i);
    return match?.[1]?.trim() ?? '';
  }

  private extractPasswordFromUnknown(value: unknown): string {
    if (typeof value === 'string') {
      return '';
    }

    if (!this.isRecord(value)) {
      return '';
    }

    const direct = this.extractPasswordFromRecord(value);
    if (direct) {
      return direct;
    }

    const data = value['data'];
    if (typeof data === 'string') {
      return '';
    }

    if (this.isRecord(data)) {
      const nested = this.extractPasswordFromRecord(data);
      if (nested) {
        return nested;
      }

      const credentials = data['credentials'];
      if (this.isRecord(credentials)) {
        return this.extractPasswordFromRecord(credentials);
      }
    }

    return '';
  }

  private extractPasswordFromRecord(record: Record<string, unknown>): string {
    const candidates = [
      'temporaryPassword',
      'tempPassword',
      'generatedPassword',
      'initialPassword',
      'plainPassword',
      'password',
    ];

    for (const key of candidates) {
      const value = this.asString(record[key]);
      if (value?.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response.trim();
    }

    if (!this.isRecord(response)) {
      return '';
    }

    const message = this.asString(response['message']);
    if (message?.trim()) {
      return message.trim();
    }

    const errors = response['errors'];
    if (Array.isArray(errors) && typeof errors[0] === 'string') {
      return errors[0].trim();
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

  private buildCredentialMessage(message: string, temporal: string): string {
    const cleanMessage = message.trim();

    if (temporal) {
      if (!cleanMessage) {
        return 'Miembro creado correctamente.';
      }

      const lowered = cleanMessage.toLowerCase();
      const contradictory =
        lowered.includes('no devolvio')
        && (lowered.includes('contrasena') || lowered.includes('password'));

      return contradictory ? 'Miembro creado correctamente.' : cleanMessage;
    }

    if (cleanMessage) {
      return cleanMessage;
    }

    return 'Miembro creado, pero la API no devolvio la contrasena temporal.';
  }

  private getOrder(member: BoardMember): number {
    return member.order ?? member.sortOrder ?? 0;
  }

  private getVisualRank(member: BoardMember): number {
    if (this.getOrder(member) === 1 && this.isVisualPresident(member)) {
      return 0;
    }

    if (this.getOrder(member) === 1) {
      return 1;
    }

    return 2;
  }

  private sortMembers(left: BoardMember, right: BoardMember): number {
    const rankDiff = this.getVisualRank(left) - this.getVisualRank(right);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    const orderDiff = this.getOrder(left) - this.getOrder(right);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return (left.fullName ?? left.name ?? '').localeCompare(right.fullName ?? right.name ?? '');
  }

  private isVisualPresident(member: BoardMember): boolean {
    return (member.email ?? '').trim().toLowerCase() === this.presidentaEmail;
  }

  private normalizeOptional(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
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

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === 'string' && error.error) {
      return error.error;
    }

    if (this.isRecord(error.error) && typeof error.error['message'] === 'string') {
      return error.error['message'];
    }

    if (error.status) {
      return `${fallback} (HTTP ${error.status}).`;
    }

    return fallback;
  }
}
