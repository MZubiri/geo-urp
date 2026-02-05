import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface UsuarioLogin {
  correo: string;
  password: string;
  rol: 'Admin' | 'Editor' | 'Consulta';
}

const USUARIOS_FAKE: UsuarioLogin[] = [
  { correo: 'admin@urp.edu.pe', password: 'admin123', rol: 'Admin' },
  { correo: 'editor@urp.edu.pe', password: 'editor123', rol: 'Editor' },
  { correo: 'consulta@urp.edu.pe', password: 'consulta123', rol: 'Consulta' },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  correo = '';
  password = '';
  error = '';

  cargando = false;

  constructor(private router: Router) {}

  login(): void {
    this.error = '';
    this.cargando = true;

    const usuario = USUARIOS_FAKE.find(
      u => u.correo === this.correo && u.password === this.password
    );

    setTimeout(() => {
      this.cargando = false;

      if (!usuario) {
        this.error = 'Credenciales inválidas';
        return;
      }

      // guardar sesión fake
      localStorage.setItem(
        'session',
        JSON.stringify({
          correo: usuario.correo,
          rol: usuario.rol
        })
      );

      // redirección fake
      this.router.navigate(['/directorio']);
    }, 800);
  }
}
