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

  onEstadoChanged(nuevoEstado: string) {
    // El '?' evita el error de "possibly undefined"
    const id = this.cita?.id;
    if (!id) return;

    this.citasService.actualizarEstadoCita(id, 'CANCELADA').subscribe({
      next: (res) => {
        Swal.fire('¡Éxito!', 'Cita actualizada', 'success');
      },
      error: (err) => {
        // Si el backend envía el error, lo mostramos aquí
        const mensajeError = err.error?.message || 'Error al actualizar';
        Swal.fire('Atención', mensajeError, 'warning');
      },
    });
  }
}
