import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-formulario.html',
})
export class PerfilFormularioComponent {
  // Recibimos el objeto del paciente desde la página principal
  @Input() paciente: any = {};
}
