import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cita } from '../../../../../core/models/cita.model';
import { CitasService } from '../../../../../core/services/citas-service';
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

  private citasService = inject(CitasService);
  // Lista de etiquetas dinámica
  tags: string[] = ['#consulta_general', '#seguimiento'];
  nuevoTag: string = '';

  agregarTag() {
    if (this.nuevoTag.trim()) {
      const tag = this.nuevoTag.startsWith('#') ? this.nuevoTag : `#${this.nuevoTag}`;
      this.tags.push(tag);
      this.nuevoTag = '';
    }
  }

  eliminarTag(index: number) {
    this.tags.splice(index, 1);
  }

  guardarNotasLocales() {
    if (!this.citaInfo?.id) return;

    Swal.fire({
      title: 'Guardando...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    // Limpiamos el objeto: solo enviamos lo que el doctor escribió
    const dataParaEnviar = {
      notas: this.citaInfo.notas,
      // Quitamos 'tags' porque ya no los usamos en la vista
    };

    this.citasService.actualizarNotasCita(this.citaInfo.id, dataParaEnviar).subscribe({
      next: () => {
        Swal.close(); // Cerramos el loading
        Swal.fire({
          icon: 'success',
          title: 'Notas guardadas',
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('Error del servidor:', err); // Revisa la consola para ver el detalle
        Swal.fire('Error', 'No se pudieron guardar las notas. Revisa la conexión.', 'error');
      },
    });
  }
}
