import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cita } from '../../../../../core/models/cita.model';
import { HistoriaClinicaService } from '../../../../../core/services/historia-clinica.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agendamiento-info-panel-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendamiento-info-panel-notas.html',
  styleUrls: ['./agendamiento-info-panel-notas.scss'],
})
export class AgendamientoInfoPanelNotas {
  @Input() citaInfo?: Cita;

  // Inyectamos nuestro nuevo servicio de Historia Clínica
  private historiaService = inject(HistoriaClinicaService);

  guardarNotasLocales() {
    if (!this.citaInfo?.id) return;

    if (!this.citaInfo.notas || !this.citaInfo.notas.trim()) {
      Swal.fire(
        'Atención',
        'Por favor, ingrese una descripción para la historia clínica antes de guardar.',
        'warning',
      );
      return;
    }

    Swal.fire({
      title: 'Guardando en Historia Clínica...',
      text: 'Almacenando registro médico de forma segura.',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    const dtoParaEnviar = {
      citaId: this.citaInfo.id,
      pacienteId: this.citaInfo.pacienteId,
      especialistaId: this.citaInfo.especialistaId,
      descripcion: this.citaInfo.notas,
    };

    // Consumimos el endpoint mediante el Caso de Uso del Back
    this.historiaService.crearHistoriaClinica(dtoParaEnviar).subscribe({
      next: (resultado) => {
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'Historia Clínica Actualizada',
          text: 'El registro se almacenó correctamente en la Clínica.',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('Error al guardar historia clínica:', err);
        Swal.close();

        const mensajeError =
          err.error?.message ||
          'No se pudo crear la historia clínica. Verifique los datos o permisos.';
        Swal.fire('Error en Registro', mensajeError, 'error');
      },
    });
  }
}
