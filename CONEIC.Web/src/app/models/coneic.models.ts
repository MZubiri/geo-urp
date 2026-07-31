export interface Actividad {
  id: number;
  apartadoId: number;
  apartadoNombre: string;
  nombre: string;
  descripcion?: string;
  horaInicio: string; // ISO date string
  horaFin: string;    // ISO date string
  urpParticipa: boolean;
  camposExtra?: string; // JSON string
}

export interface Apartado {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  actividades: Actividad[];
}

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  token: string;
}

export interface UserAdmin {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  fechaRegistro: string;
}

export interface AuthResponse {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  token: string;
}

export interface AgendaResponse {
  status: 'SUCCESS' | 'CONFLICT';
  message: string;
  conflictingActivity?: {
    id: number;
    nombre: string;
    horaInicio: string;
    horaFin: string;
  };
}
