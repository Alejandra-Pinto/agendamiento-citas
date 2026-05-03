import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agendamiento-estados-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agendamiento-estados-citas.html',
  styleUrls: ['./agendamiento-estados-citas.scss'],
})
export class AgendamientoEstadosCitas {
  @Input() citaId: string | undefined;
  @Input() estadoActual: 'PROGRAMADA' | 'CANCELADA' | 'REAGENDADA' | 'FINALIZADA' | string | undefined = 'PROGRAMADA';
  @Output() alCambiarEstado = new EventEmitter<string>();

  // Definimos los estilos según el estado para que sea visual
  get colorEstado(): string {
    switch (this.estadoActual) {
      case 'FINALIZADA':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELADA':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'REAGENDADA':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PROGRAMADA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  cambiarEstado(nuevoEstado: string) {
    this.alCambiarEstado.emit(nuevoEstado);
  }
}
