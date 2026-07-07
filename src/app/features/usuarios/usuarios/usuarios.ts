import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';

import { UserItem, UsersService } from '../../../core/users/users.service';

interface UserForm {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  roles: string[];
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  usuarios: UserItem[] = [];
  rolesDisponibles: string[] = [];
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';
  modalError = '';

  busqueda = '';
  filtroRol = 'Todos';
  filtroEstado = 'Todos';
  roles = ['Todos'];

  modalForm = false;
  modalEliminar = false;
  modalRoles = false;
  formSubmitted = false;
  editandoId: number | null = null;
  usuarioSeleccionado: UserItem | null = null;
  usuarioRolesSeleccionado: UserItem | null = null;
  rolesDraft: string[] = [];

  form: UserForm = this.emptyForm();

  constructor(
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarRolesDisponibles();
    this.cargarUsuarios();
  }

  get usuariosFiltrados(): UserItem[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.usuarios.filter((u) => {
      const nombre = (u.name ?? '').toLowerCase();
      const correo = (u.email ?? '').toLowerCase();
      const rolesUsuario = this.rolesDeUsuario(u);
      const estado = u.isActive === false ? 'Inactivo' : 'Activo';

      const porTexto = !texto || nombre.includes(texto) || correo.includes(texto);
      const porRol =
        this.filtroRol === 'Todos'
        || (this.filtroRol === 'Sin rol' && rolesUsuario.length === 0)
        || rolesUsuario.includes(this.filtroRol);
      const porEstado = this.filtroEstado === 'Todos' || estado === this.filtroEstado;

      return porTexto && porRol && porEstado;
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';

    this.usersService
      .getUsers()
      .pipe(
        timeout(10000),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.usuarios = this.extractData(response)
            .map((item) => this.mapUser(item))
            .filter((item): item is UserItem => !!item);

          this.sincronizarCatalogoRoles();
        },
        error: (error: HttpErrorResponse) => {
          this.error = this.getErrorMessage(error, 'No se pudieron cargar los usuarios.');
        },
      });
  }

  cargarRolesDisponibles(): void {
    this.usersService
      .getRoles()
      .pipe(timeout(10000))
      .subscribe({
        next: (response) => {
          this.rolesDisponibles = this.uniqueValues(
            this.extractData(response)
              .map((item) => this.mapRoleName(item))
              .filter((role): role is string => !!role),
          );
          this.sincronizarCatalogoRoles();
        },
        error: () => {
          this.rolesDisponibles = [];
          this.sincronizarCatalogoRoles();
        },
      });
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.formSubmitted = false;
    this.modalError = '';
    this.form = this.emptyForm();
    this.modalForm = true;
  }

  editar(user: UserItem): void {
    this.editandoId = user.id ?? null;
    this.formSubmitted = false;
    this.modalError = '';
    this.form = {
      name: user.name ?? '',
      email: user.email ?? '',
      password: '',
      isActive: user.isActive !== false,
      roles: [...this.rolesDeUsuario(user)],
    };
    this.modalForm = true;
  }

  abrirRoles(user: UserItem): void {
    this.usuarioRolesSeleccionado = user;
    this.rolesDraft = [...this.rolesDeUsuario(user)];
    this.modalError = '';
    this.modalRoles = true;
  }

  guardar(): void {
    this.formSubmitted = true;
    this.modalError = '';
    this.error = '';
    this.mensaje = '';

    if (!this.isFormValid()) {
      return;
    }

    const payload: UserItem = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      isActive: this.form.isActive,
      roles: [...this.form.roles],
    };

    if (this.form.password.trim()) {
      payload.password = this.form.password.trim();
    }

    this.guardando = true;
    const request$ = this.editandoId
      ? this.usersService.update(this.editandoId, payload)
      : this.usersService.create(payload);

    request$.subscribe({
      next: () => {
        this.finishSave(this.editandoId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.modalError = this.getErrorMessage(error, 'No se pudo guardar el usuario.');
      },
    });
  }

  guardarRoles(): void {
    if (!this.usuarioRolesSeleccionado?.id) {
      return;
    }

    this.modalError = '';
    this.error = '';
    this.mensaje = '';

    if (this.rolesDraft.length === 0) {
      this.modalError = 'Selecciona al menos un rol.';
      return;
    }

    this.guardando = true;
    this.usersService.updateRoles(this.usuarioRolesSeleccionado.id, this.rolesDraft).subscribe({
      next: () => {
        this.guardando = false;
        this.modalRoles = false;
        this.usuarioRolesSeleccionado = null;
        this.rolesDraft = [];
        this.mensaje = 'Roles actualizados correctamente.';
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.modalError = this.getErrorMessage(error, 'No se pudieron actualizar los roles.');
      },
    });
  }

  eliminar(user: UserItem): void {
    if (!user.id) {
      return;
    }

    this.usuarioSeleccionado = user;
    this.modalError = '';
    this.modalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.usuarioSeleccionado?.id) {
      return;
    }

    this.guardando = true;
    this.modalError = '';
    this.error = '';
    this.mensaje = '';

    this.usersService.remove(this.usuarioSeleccionado.id).subscribe({
      next: () => {
        this.guardando = false;
        this.modalEliminar = false;
        this.usuarioSeleccionado = null;
        this.mensaje = 'Usuario eliminado correctamente.';
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.modalEliminar = false;
        this.usuarioSeleccionado = null;
        this.error = this.getErrorMessage(error, 'No se pudo eliminar el usuario.');
      },
    });
  }

  cerrar(): void {
    this.modalForm = false;
    this.modalEliminar = false;
    this.modalRoles = false;
    this.form = this.emptyForm();
    this.formSubmitted = false;
    this.editandoId = null;
    this.usuarioSeleccionado = null;
    this.usuarioRolesSeleccionado = null;
    this.rolesDraft = [];
    this.modalError = '';
  }

  trackById(_: number, u: UserItem): number | string {
    return u.id ?? u.email ?? _;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim());
  }

  isFormValid(): boolean {
    const hasRequired = !!this.form.name.trim() && this.isEmailValid() && this.form.roles.length > 0;

    if (this.editandoId) {
      return hasRequired;
    }

    return hasRequired && !!this.form.password.trim();
  }

  toggleFormRole(role: string, checked: boolean): void {
    this.form.roles = this.updateSelection(this.form.roles, role, checked);
  }

  toggleDraftRole(role: string, checked: boolean): void {
    this.rolesDraft = this.updateSelection(this.rolesDraft, role, checked);
  }

  isFormRoleSelected(role: string): boolean {
    return this.form.roles.includes(role);
  }

  isDraftRoleSelected(role: string): boolean {
    return this.rolesDraft.includes(role);
  }

  rolesDeUsuario(user: UserItem): string[] {
    return this.uniqueValues(user.roles ?? []);
  }

  rolesTexto(user: UserItem): string {
    const roles = this.rolesDeUsuario(user);
    return roles.length > 0 ? roles.join(', ') : 'Sin rol';
  }

  private finishSave(message: string): void {
    this.guardando = false;
    this.modalForm = false;
    this.form = this.emptyForm();
    this.formSubmitted = false;
    this.editandoId = null;
    this.modalError = '';
    this.mensaje = message;
    this.cargarUsuarios();
  }

  private sincronizarCatalogoRoles(): void {
    const rolesUsuarios = this.usuarios.flatMap((user) => this.rolesDeUsuario(user));
    const filtroRoles = this.uniqueValues([...this.rolesDisponibles, ...rolesUsuarios]);
    const hasUsersWithoutRole = this.usuarios.some((user) => this.rolesDeUsuario(user).length === 0);

    this.roles = ['Todos', ...filtroRoles, ...(hasUsersWithoutRole ? ['Sin rol'] : [])];

    if (!this.roles.includes(this.filtroRol)) {
      this.filtroRol = 'Todos';
    }
  }

  private emptyForm(): UserForm {
    return {
      name: '',
      email: '',
      password: '',
      isActive: true,
      roles: [],
    };
  }

  private updateSelection(current: string[], role: string, checked: boolean): string[] {
    if (checked) {
      return this.uniqueValues([...current, role]);
    }

    return current.filter((item) => item !== role);
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(
      values
        .map((value) => value.trim())
        .filter((value) => !!value),
    )).sort((a, b) => a.localeCompare(b));
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

  private mapUser(payload: unknown): UserItem | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    const id = this.asNumber(payload['id']);
    const name = this.asString(payload['name']) ?? '';
    const email = this.asString(payload['email']) ?? '';

    if (!name) {
      return null;
    }

    return {
      id,
      name,
      email,
      isActive: this.asBoolean(payload['isActive']) ?? true,
      roles: this.extractRoles(payload),
    };
  }

  private mapRoleName(payload: unknown): string | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    const isActive = this.asBoolean(payload['isActive']);
    if (isActive === false) {
      return null;
    }

    return this.asString(payload['name'])?.trim() ?? null;
  }

  private extractRoles(payload: Record<string, unknown>): string[] {
    const roles = payload['roles'];
    if (Array.isArray(roles)) {
      return this.uniqueValues(
        roles.filter((r): r is string => typeof r === 'string' && !!r.trim()).map((r) => r.trim()),
      );
    }

    const userRoles = payload['userRoles'];
    if (Array.isArray(userRoles)) {
      return this.uniqueValues(userRoles
        .map((r) => {
          if (!this.isRecord(r)) {
            return null;
          }

          const roleObj = r['role'];
          if (this.isRecord(roleObj)) {
            return this.asString(roleObj['name']) ?? this.asString(roleObj['roleName']) ?? null;
          }

          return this.asString(r['roleName']) ?? null;
        })
        .filter((r): r is string => typeof r === 'string' && !!r.trim()));
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
