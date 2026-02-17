import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'directorio' },

  {
    path: 'directorio',
    loadComponent: () => import('./features/directorio/directorio/directorio').then((m) => m.Directorio),
  },

  {
    path: 'eventos',
    loadComponent: () => import('./features/eventos/eventos/eventos').then((m) => m.Eventos),
  },

  {
    path: 'biblioteca',
    canActivate: [authGuard],
    loadComponent: () => import('./features/biblioteca/biblioteca/biblioteca').then((m) => m.Biblioteca),
  },

  {
    path: 'pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pedidos/pedidos/pedidos').then((m) => m.Pedidos),
  },

  {
    path: 'miembros',
    canActivate: [authGuard],
    loadComponent: () => import('./features/miembros/miembros/miembros').then((m) => m.Miembros),
  },

  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/usuarios/usuarios/usuarios').then((m) => m.Usuarios),
  },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  { path: '**', redirectTo: 'directorio' },
];
