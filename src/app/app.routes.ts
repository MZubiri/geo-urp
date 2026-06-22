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
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.Register),
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
    path: 'admin/aprobaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/aprobaciones/aprobaciones').then((m) => m.Aprobaciones),
  },
  { path: 'cambiar-contrasena', redirectTo: 'mi-perfil', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
