import { Routes } from '@angular/router';

import { authGuard, guestGuard, membersOnlyGuard, ordersOnlyGuard, usersOnlyGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    path: 'directorio',
    loadComponent: () => import('./features/directorio/directorio/directorio').then((m) => m.Directorio),
  },
  {
    path: 'eventos',
    loadComponent: () => import('./features/eventos/eventos/eventos').then((m) => m.Eventos),
  },
  {
    path: 'afiliacion/cita',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/entrevistas/registro-cita/registro-cita').then((m) => m.RegistroCita),
  },
  {
    path: 'biblioteca',
    canActivate: [authGuard],
    loadComponent: () => import('./features/biblioteca/biblioteca/biblioteca').then((m) => m.Biblioteca),
  },
  {
    path: 'biblioteca/categorias',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/biblioteca/categorias/biblioteca-categorias').then((m) => m.BibliotecaCategorias),
  },
  {
    path: 'pedidos',
    canActivate: [ordersOnlyGuard],
    loadComponent: () => import('./features/pedidos/pedidos/pedidos').then((m) => m.Pedidos),
  },
  {
    path: 'miembros',
    canActivate: [membersOnlyGuard],
    loadComponent: () => import('./features/miembros/miembros/miembros').then((m) => m.Miembros),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/perfil/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'admin/usuarios',
    canActivate: [usersOnlyGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios/usuarios').then((m) => m.Usuarios),
  },
  {
    path: 'admin/entrevistas/turnos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/entrevistas/turnos-entrevista/turnos-entrevista').then((m) => m.TurnosEntrevista),
  },
  {
    path: 'admin/entrevistas/citas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/entrevistas/citas-registradas/citas-registradas').then((m) => m.CitasRegistradas),
  },
  { path: 'cambiar-contrasena', redirectTo: 'mi-perfil', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
