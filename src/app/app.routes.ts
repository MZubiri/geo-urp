import { Routes } from '@angular/router';

export const routes: Routes = [

  // 🏠 HOME (index visual)
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home/home')
        .then(m => m.Home),
  },

  // 📂 DIRECTORIO
  {
    path: 'directorio',
    loadComponent: () =>
      import('./features/directorio/directorio/directorio')
        .then(m => m.Directorio),
  },

  // 📅 EVENTOS
  {
    path: 'eventos',
    loadComponent: () =>
      import('./features/eventos/eventos/eventos')
        .then(m => m.Eventos),
  },

  // 📚 BIBLIOTECA
  {
    path: 'biblioteca',
    loadComponent: () =>
      import('./features/biblioteca/biblioteca/biblioteca')
        .then(m => m.Biblioteca),
  },

  // 📦 PEDIDOS
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./features/pedidos/pedidos/pedidos')
        .then(m => m.Pedidos),
  },

  // 👥 MIEMBROS
  {
    path: 'miembros',
    loadComponent: () =>
      import('./features/miembros/miembros/miembros')
        .then(m => m.Miembros),
  },

  // 👤 USUARIOS
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/usuarios/usuarios')
        .then(m => m.Usuarios),
  },

  // 🔐 LOGIN
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login),
  },

  // 🚧 CUALQUIER OTRA COSA → HOME
  { path: '**', redirectTo: '' }
];
