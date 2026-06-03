import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../../core/services/citas-service';
import { HistoriaClinicaService } from '../../../../core/services/historia-clinica.service'; // 👈 Inyectamos el nuevo servicio
import { AgendamientoInfoMedico } from '../../components/vista-cita-doctor/agendamiento-info-medico/agendamiento-info-medico';
import { AgendamientoInfoPanelNotas } from '../../components/vista-cita-doctor/agendamiento-info-panel-notas/agendamiento-info-panel-notas';
import { PacientePerfilCard } from '../../components/vista-cita-doctor/paciente-perfil-card/paciente-perfil-card';
import { AgendamientoEstadosCitas } from '../../components/vista-cita-doctor/agendamiento-estados-citas/agendamiento-estados-citas';
import Swal from 'sweetalert2';
import { Cita } from '../../../../core/models/cita.model';

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
  private router = inject(Router);
  private citasService = inject(CitasService);
  private historiaService = inject(HistoriaClinicaService); // 👈 Guardamos la referencia

  cita?: Cita;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatosCita(id);
    }
  }

  cargarDatosCita(id: string) {
    this.citasService.obtenerCitaPorId(id).subscribe({
      next: (data: any) => {
        this.cita = Array.isArray(data) ? data[0] : data;
        if (this.cita) {
          this.cita.especialistaNombre = this.cita.especialista
            ? `${this.cita.especialista.nombre} ${this.cita.especialista.apellidos}`
            : 'Médico no asignado';
          this.cargarHistoriaClinicaDeCita(this.cita.id);
        }
      },
      error: (err) => Swal.fire('Error', 'No se pudo cargar la información', 'error'),
    });
  }

  cargarHistoriaClinicaDeCita(citaId: string) {
    this.historiaService.obtenerHistoriaPorCita(citaId).subscribe({
      next: (historia: any) => {
        if (historia && historia.descripcion && this.cita) {
          this.cita.notas = historia.descripcion;
        }
      },
      error: (err) => {
        console.log('Cita nueva sin historia clínica previa.');
      },
    });
  }

  onEstadoChanged(nuevoEstado: string) {
    if (!this.cita || !this.cita.id) {
      Swal.fire('Error', 'No se pudo identificar la cita actual.', 'error');
      return;
    }

    const id = this.cita.id;

    if (nuevoEstado === 'PROGRAMADA') {
      const fechaHoraOriginal = this.cita.fechaHora;

      Swal.fire({
        title: 'Procesando reversión...',
        text: 'Restaurando el estado de la cita...',
        didOpen: () => Swal.showLoading(),
      });

      this.citasService.reagendarCita(id, fechaHoraOriginal).subscribe({
        next: () => {
          if (this.cita) this.cita.estado = 'PROGRAMADA' as any;
          Swal.fire(
            '¡Éxito!',
            'La cita ha sido restaurada a estado PROGRAMADA con éxito.',
            'success',
          );
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo restaurar la cita.', 'error');
        },
      });
      return;
    }

    this.citasService.actualizarEstadoCita(id, nuevoEstado).subscribe({
      next: () => {
        if (this.cita) this.cita.estado = nuevoEstado as any;
        Swal.fire('¡Éxito!', `La cita pasó al estado ${nuevoEstado}`, 'success');
      },
      error: (err) =>
        Swal.fire('Error', err.error?.message || 'No se pudo cambiar el estado', 'error'),
    });
  }

  redirigirANuevoAgendamiento() {
    if (!this.cita || !this.cita.pacienteId) {
      Swal.fire('Atención', 'No se encontraron datos del paciente para transferir.', 'warning');
      return;
    }

    this.router.navigate(['/agendar'], {
      queryParams: { pacienteId: this.cita.pacienteId },
    });
  }
}
