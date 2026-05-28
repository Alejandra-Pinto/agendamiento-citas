import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-perfil-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-navbar.html',
})
export class PerfilNavbarComponent {
  constructor(private location: Location) {}

  volver() {
    this.location.back(); // Te devuelve a la pantalla anterior
  }
}
