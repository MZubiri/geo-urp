import { Routes } from '@angular/router';
import { CronogramaComponent } from './pages/cronograma/cronograma.component';
import { MiCalendarioComponent } from './pages/mi-calendario/mi-calendario.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: CronogramaComponent },
  { path: 'mi-calendario', component: MiCalendarioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
