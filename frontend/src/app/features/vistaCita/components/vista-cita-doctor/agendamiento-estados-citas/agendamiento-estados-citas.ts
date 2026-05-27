import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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
  @Output() alReagendar = new EventEmitter<void>();

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

intentarCambioEstado(nuevoEstado: string) {
  const estadoDesde = this.estadoActual ? this.estadoActual.toUpperCase() : '';
  const estadoHacia = nuevoEstado.toUpperCase();

  // REGLA 1: Evitar re-aplicar el mismo estado
  if (estadoDesde === estadoHacia) {
    Swal.fire({
      icon: 'info',
      title: 'Estado idéntico',
      text: `La cita ya se encuentra en estado ${estadoHacia}.`,
      confirmButtonColor: '#3b82f6'
    });
    return;
  }

  // REGLA 2: Si la cita está FINALIZADA y quieren corregir el error volviendo a PROGRAMADA
  if (estadoDesde === 'FINALIZADA') {
    if (estadoHacia === 'PROGRAMADA') {
      Swal.fire({
        title: '¿Revertir finalización?',
        text: `¿Desea regresar esta cita a estado PROGRAMADA? Use esto solo si la marcó como finalizada por error.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sí, revertir',
        cancelButtonText: 'No, mantener finalizada'
      }).then((result) => {
        if (result.isConfirmed) {
          this.alCambiarEstado.emit(nuevoEstado);
        }
      });
      return;
    } else {
      // Bloqueo si intentan pasar de FINALIZADA a CANCELADA directo sin pasar por PROGRAMADA
      Swal.fire({
        icon: 'error',
        title: 'Tránsito no permitido',
        text: `No se puede cancelar una cita que ya fue finalizada. Si fue un error, primero devuélvala a estado PROGRAMADA.`,
        confirmButtonColor: '#ef4444'
      });
      return;
    }
  }

  // REGLA 3: Si la cita está CANCELADA y quieren corregir el error volviendo a PROGRAMADA
  if (estadoDesde === 'CANCELADA') {
    if (estadoHacia === 'PROGRAMADA') {
      Swal.fire({
        title: '¿Reactivar cita?',
        text: `¿Desea restaurar esta cita y cambiar su estado a PROGRAMADA?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'No, dejar cancelada'
      }).then((result) => {
        if (result.isConfirmed) {
          this.alCambiarEstado.emit(nuevoEstado);
        }
      });
      return;
    } else {
      // Bloqueo si intentan pasar de CANCELADA a FINALIZADA directo
      Swal.fire({
        icon: 'error',
        title: 'Tránsito no permitido',
        text: `No se puede finalizar una cita que está cancelada. Primero restáurela a estado PROGRAMADA.`,
        confirmButtonColor: '#ef4444'
      });
      return;
    }
  }

  // Flujo normal: De PROGRAMADA a FINALIZADA o CANCELADA
  this.alCambiarEstado.emit(nuevoEstado);
}

  reagendarPaciente() {
    this.alReagendar.emit();
  }
}
