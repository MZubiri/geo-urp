import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Apartado, Actividad, UserAdmin } from '../../models/coneic.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeTab: 'ACTIVIDADES' | 'USUARIOS' = 'ACTIVIDADES';

  apartados: Apartado[] = [];
  usuarios: UserAdmin[] = [];
  isLoading = true;

  // Modal Control Flags
  showActividadModal = false;
  showApartadoModal = false;
  showUsuarioModal = false;
  showConfirmDeleteModal = false;

  // Confirm Delete State
  deleteType: 'ACTIVIDAD' | 'APARTADO' | 'USUARIO' | null = null;
  deleteId: number | null = null;
  deleteTargetName: string = '';

  // New Apartado Form
  nuevoApartadoNombre = '';
  nuevoApartadoOrden = 1;

  // New/Edit Activity Form
  editingActividadId: number | null = null;
  actApartadoId = 1;
  actNombre = '';
  actDescripcion = '';
  actHoraInicio = '2026-08-10T08:00';
  actHoraFin = '2026-08-10T12:00';
  actUrpParticipa = false;
  actCamposExtraJson = '{"modalidad": "Presencial"}';

  // User Management State
  userSearchTerm = '';
  editingUserId: number | null = null;
  userNombre = '';
  userCorreo = '';
  userPassword = '';
  userRol: 'USER' | 'ADMIN' = 'USER';

  messageSuccess = '';
  messageError = '';

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadData();
    this.loadUsuarios();
  }

  loadData(): void {
    this.isLoading = true;
    this.apiService.getCalendarioGeneral().subscribe({
      next: (data) => {
        this.apartados = data;
        if (this.apartados.length > 0 && !this.actApartadoId) {
          this.actApartadoId = this.apartados[0].id;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadUsuarios(): void {
    this.apiService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
      }
    });
  }

  get filteredUsuarios(): UserAdmin[] {
    if (!this.userSearchTerm.trim()) {
      return this.usuarios;
    }
    const term = this.userSearchTerm.toLowerCase();
    return this.usuarios.filter(u => 
      u.nombre.toLowerCase().includes(term) || 
      u.correo.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  }

  // --- MODAL CONTROLS FOR ACTIVIDAD ---
  openNuevaActividadModal(): void {
    this.resetActividadForm();
    if (this.apartados.length > 0) {
      this.actApartadoId = this.apartados[0].id;
    }
    this.showActividadModal = true;
  }

  openEditarActividadModal(act: Actividad): void {
    this.editingActividadId = act.id;
    this.actApartadoId = act.apartadoId;
    this.actNombre = act.nombre;
    this.actDescripcion = act.descripcion || '';
    this.actHoraInicio = this.toLocalDatetimeString(act.horaInicio);
    this.actHoraFin = this.toLocalDatetimeString(act.horaFin);
    this.actUrpParticipa = act.urpParticipa;
    this.actCamposExtraJson = act.camposExtra || '{}';
    this.showActividadModal = true;
  }

  private toLocalDatetimeString(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.slice(0, 16);
    }
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  closeActividadModal(): void {
    this.showActividadModal = false;
    this.resetActividadForm();
  }

  // --- MODAL CONTROLS FOR APARTADO ---
  openNuevoApartadoModal(): void {
    this.nuevoApartadoNombre = '';
    this.nuevoApartadoOrden = this.apartados.length + 1;
    this.showApartadoModal = true;
  }

  closeApartadoModal(): void {
    this.showApartadoModal = false;
    this.nuevoApartadoNombre = '';
  }

  // --- MODAL CONTROLS FOR USUARIO ---
  openNuevoUsuarioModal(): void {
    this.resetUserForm();
    this.showUsuarioModal = true;
  }

  openEditarUsuarioModal(user: UserAdmin): void {
    this.editingUserId = user.id;
    this.userNombre = user.nombre;
    this.userCorreo = user.correo;
    this.userRol = user.rol === 'ADMIN' ? 'ADMIN' : 'USER';
    this.userPassword = '';
    this.showUsuarioModal = true;
  }

  closeUsuarioModal(): void {
    this.showUsuarioModal = false;
    this.resetUserForm();
  }

  // --- MODAL CONTROLS FOR DELETE ---
  openConfirmDeleteModal(type: 'ACTIVIDAD' | 'APARTADO' | 'USUARIO', id: number, name: string): void {
    this.deleteType = type;
    this.deleteId = id;
    this.deleteTargetName = name;
    this.showConfirmDeleteModal = true;
  }

  closeConfirmDeleteModal(): void {
    this.showConfirmDeleteModal = false;
    this.deleteType = null;
    this.deleteId = null;
    this.deleteTargetName = '';
  }

  confirmDelete(): void {
    if (!this.deleteType || !this.deleteId) return;

    if (this.deleteType === 'ACTIVIDAD') {
      this.apiService.eliminarActividad(this.deleteId).subscribe({
        next: () => {
          this.messageSuccess = `Actividad "${this.deleteTargetName}" eliminada con éxito.`;
          this.closeConfirmDeleteModal();
          this.loadData();
        },
        error: () => {
          this.messageError = 'Error al eliminar actividad.';
          this.closeConfirmDeleteModal();
        }
      });
    } else if (this.deleteType === 'APARTADO') {
      this.apiService.eliminarApartado(this.deleteId).subscribe({
        next: () => {
          this.messageSuccess = `Categoría "${this.deleteTargetName}" eliminada con éxito.`;
          this.closeConfirmDeleteModal();
          this.loadData();
        },
        error: () => {
          this.messageError = 'Error al eliminar categoría.';
          this.closeConfirmDeleteModal();
        }
      });
    } else if (this.deleteType === 'USUARIO') {
      this.apiService.eliminarUsuario(this.deleteId).subscribe({
        next: () => {
          this.messageSuccess = `Usuario "${this.deleteTargetName}" eliminado con éxito.`;
          this.closeConfirmDeleteModal();
          this.loadUsuarios();
        },
        error: (err) => {
          this.messageError = err.error?.message || 'Error al eliminar usuario.';
          this.closeConfirmDeleteModal();
        }
      });
    }
  }

  // --- SAVE ACTIONS VIA MODALS ---
  guardarApartadoModal(): void {
    if (!this.nuevoApartadoNombre.trim()) {
      this.messageError = 'El nombre de la categoría es obligatorio.';
      return;
    }
    this.apiService.crearApartado({
      nombre: this.nuevoApartadoNombre,
      orden: this.nuevoApartadoOrden
    }).subscribe({
      next: () => {
        this.messageSuccess = `Categoría "${this.nuevoApartadoNombre}" creada exitosamente.`;
        this.closeApartadoModal();
        this.loadData();
      },
      error: () => this.messageError = 'Error al crear la categoría.'
    });
  }

  guardarActividadModal(): void {
    if (!this.actNombre || !this.actHoraInicio || !this.actHoraFin) {
      this.messageError = 'Completa los campos obligatorios de la actividad.';
      return;
    }

    const horaInicioFormatted = this.actHoraInicio.length === 16 ? this.actHoraInicio + ':00' : this.actHoraInicio;
    const horaFinFormatted = this.actHoraFin.length === 16 ? this.actHoraFin + ':00' : this.actHoraFin;

    const payload: Partial<Actividad> = {
      apartadoId: this.actApartadoId,
      nombre: this.actNombre,
      descripcion: this.actDescripcion,
      horaInicio: horaInicioFormatted,
      horaFin: horaFinFormatted,
      urpParticipa: this.actUrpParticipa,
      camposExtra: this.actCamposExtraJson
    };

    if (this.editingActividadId) {
      this.apiService.actualizarActividad(this.editingActividadId, payload).subscribe({
        next: () => {
          this.messageSuccess = `Actividad "${this.actNombre}" actualizada.`;
          this.closeActividadModal();
          this.loadData();
        },
        error: () => this.messageError = 'Error al actualizar actividad.'
      });
    } else {
      this.apiService.crearActividad(payload).subscribe({
        next: () => {
          this.messageSuccess = `Actividad "${this.actNombre}" creada con éxito.`;
          this.closeActividadModal();
          this.loadData();
        },
        error: () => this.messageError = 'Error al crear actividad.'
      });
    }
  }

  guardarUsuarioModal(): void {
    this.messageSuccess = '';
    this.messageError = '';

    if (!this.userNombre || !this.userCorreo) {
      this.messageError = 'El nombre y correo del usuario son obligatorios.';
      return;
    }

    if (!this.editingUserId && !this.userPassword) {
      this.messageError = 'Debes especificar una contraseña para el nuevo usuario.';
      return;
    }

    if (this.editingUserId) {
      this.apiService.actualizarUsuario(this.editingUserId, {
        nombre: this.userNombre,
        correo: this.userCorreo,
        rol: this.userRol,
        password: this.userPassword || undefined
      }).subscribe({
        next: (updatedUser) => {
          this.messageSuccess = `Usuario "${updatedUser.nombre}" actualizado con éxito.`;
          this.closeUsuarioModal();
          this.loadUsuarios();
        },
        error: (err) => {
          this.messageError = err.error?.message || 'Error al actualizar usuario.';
        }
      });
    } else {
      this.apiService.crearUsuario({
        nombre: this.userNombre,
        correo: this.userCorreo,
        password: this.userPassword,
        rol: this.userRol
      }).subscribe({
        next: (newUser) => {
          this.messageSuccess = `Usuario "${newUser.nombre}" creado exitosamente.`;
          this.closeUsuarioModal();
          this.loadUsuarios();
        },
        error: (err) => {
          this.messageError = err.error?.message || 'Error al crear usuario.';
        }
      });
    }
  }

  resetUserForm(): void {
    this.editingUserId = null;
    this.userNombre = '';
    this.userCorreo = '';
    this.userPassword = '';
    this.userRol = 'USER';
  }

  resetActividadForm(): void {
    this.editingActividadId = null;
    this.actNombre = '';
    this.actDescripcion = '';
    this.actUrpParticipa = false;
    this.actCamposExtraJson = '{"modalidad": "Presencial"}';
  }
}
