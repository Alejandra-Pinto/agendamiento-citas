import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-formulario.html',
})
export class PerfilFormularioComponent {
  @Input() paciente: any = {};

  @Output() onGuardarDatos = new EventEmitter<void>();
  @Output() onGuardarContrasena = new EventEmitter<void>();

  // Variable para controlar si mostramos o no los campos de contraseña
  mostrarCambioContrasena = false;

  toggleContrasena() {
    this.mostrarCambioContrasena = !this.mostrarCambioContrasena;
    // Si el usuario se arrepiente y cierra la sección, limpiamos las contraseñas
    if (!this.mostrarCambioContrasena) {
      this.paciente.nuevaContrasena = '';
      this.paciente.confirmarContrasena = '';
    }
  }

  emitirGuardarDatos() {
    this.onGuardarDatos.emit();
  }

  emitirGuardarContrasena() {
    this.onGuardarContrasena.emit();
  }
}
