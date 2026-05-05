import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule
import { CitasService } from '../../../../core/services/citas-service'; // Ajusta la ruta
import { AgendamientoInfoMedico } from '../../components/vista-cita-doctor/agendamiento-info-medico/agendamiento-info-medico';
import { AgendamientoInfoPanelNotas } from '../../components/vista-cita-doctor/agendamiento-info-panel-notas/agendamiento-info-panel-notas';
import { PacientePerfilCard } from '../../components/vista-cita-doctor/paciente-perfil-card/paciente-perfil-card';
import { AgendamientoEstadosCitas } from '../../components/vista-cita-doctor/agendamiento-estados-citas/agendamiento-estados-citas';
import Swal from 'sweetalert2';
import { Cita } from '../../../../core/models/cita.model'; // Asegúrate de tener este modelo definido

@Component({
  selector: 'app-vista-cita-doctor',
  standalone: true,
  imports: [
    CommonModule,
    AgendamientoInfoMedico,
    AgendamientoInfoPanelNotas,
    PacientePerfilCard,
    AgendamientoEstadosCitas,
  ],
  templateUrl: './vista-cita-doctor.html',
  styleUrl: './vista-cita-doctor.scss',
})
export class VistaCitaDoctor implements OnInit {
  private route = inject(ActivatedRoute);
  private citasService = inject(CitasService);

  cita?: Cita; // Usamos el modelo real

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatosCita(id);
    }
  }

  cambiarEstadoDeCita(nuevoEstado: string) {
    // 1. Solución al error 'Object is possibly undefined'
    if (!this.cita || !this.cita.id) {
      console.error('No hay ID de cita disponible');
      return;
    }

    this.citasService.actualizarEstadoCita(this.cita.id, nuevoEstado).subscribe({
      next: () => {
        // 2. Solución al error de asignación de tipo string
        // Usamos 'as any' o el tipo específico para que TS no bloquee la asignación
        if (this.cita) {
          this.cita.estado = nuevoEstado as any;
        }

        Swal.fire('¡Éxito!', 'Estado actualizado', 'success');
      },
      error: (err) => {
        console.error('Error detallado del back:', err);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      },
    });
  }
  cargarDatosCita(id: string) {
    this.citasService.obtenerCitaPorId(id).subscribe({
      next: (data: any) => {
        // Si la API devuelve un array, toma el primero. Si no, usa el objeto.
        this.cita = Array.isArray(data) ? data[0] : data;

        if (this.cita) {
          this.cita.especialistaNombre = this.cita.especialista
            ? `${this.cita.especialista.nombre} ${this.cita.especialista.apellidos}`
            : 'Médico no asignado';
        }
      },
      error: (err) => Swal.fire('Error', 'No se pudo cargar la información', 'error'),
    });
  }

  async onEstadoChanged(nuevoEstado: string) {
    const id = this.cita?.id;
    if (!id) return;

    // Si el usuario eligió REAGENDADA, necesitamos una fecha
    if (nuevoEstado === 'REAGENDADA') {
      const { value: fechaSeleccionada } = await Swal.fire({
        title: 'Seleccionar nueva fecha y hora',
        html: `
        <input type="datetime-local" id="fechaHora" class="swal2-input" 
               min="${new Date().toISOString().slice(0, 16)}">
      `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Reagendar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const valor = (document.getElementById('fechaHora') as HTMLInputElement).value;
          if (!valor) {
            Swal.showValidationMessage('Debes seleccionar una fecha');
          }
          return valor;
        },
      });

      // Si el usuario seleccionó una fecha y le dio a "Reagendar"
      if (fechaSeleccionada) {
        this.ejecutarReagendamiento(id, fechaSeleccionada);
      }
    } else {
      // Para los demás estados (FINALIZADA, CANCELADA, etc.)
      this.citasService.actualizarEstadoCita(id, nuevoEstado).subscribe({
        next: () => {
          if (this.cita) this.cita.estado = nuevoEstado as any;
          Swal.fire('¡Éxito!', 'Estado actualizado', 'success');
        },
        error: (err) => Swal.fire('Error', err.error?.message, 'error'),
      });
    }
  }

  // Creamos un método aparte para que el código sea más ordenado
  private ejecutarReagendamiento(id: string, nuevaFecha: string) {
    this.citasService.reagendarCita(id, nuevaFecha).subscribe({
      next: (res) => {
        if (this.cita) {
          this.cita.estado = 'REAGENDADA';
          this.cita.fechaHora = nuevaFecha; // Guardamos el string que nos dio el input
        }
        Swal.fire('¡Reagendada!', 'La cita ha sido movida con éxito', 'success');
      },
      error: (err) => {
        // Aquí el backend te dirá si hay solapamiento o si es fin de semana
        Swal.fire('No se pudo reagendar', err.error?.message || 'Error de validación', 'error');
      },
    });
  }
}
