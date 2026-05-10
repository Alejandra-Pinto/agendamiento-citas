import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EspecialistaService } from '../../../../core/services/especialista.service';
import { AdminService } from '../../../../core/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-agenda.html',
})
export class ConfiguracionAdmin implements OnInit {
  especialistas: any[] = [];
  espExpandedId: string | null = null;

  semanasGlobal = 4;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  intervalos = [5, 10, 15, 20, 25, 30, 40, 50];

  constructor(
    private especialistaService: EspecialistaService,
    private adminService: AdminService
  ) {}

  ngOnInit() {

    // Inicializar especialistas con config (CLAVE)
    this.especialistaService.listarEspecialistas().subscribe((data: any[]) => {
      this.especialistas = data.map(esp => ({
        ...esp,
        config: {
          intervaloAtencion: 30,
          horarioAtencion: {
            horaInicio: '',
            horaFin: '',
            diaSemana: []
          }
        }
      }));
    });

    this.adminService.obtenerConfiguracionGlobal().subscribe((data: any) => {
      if (data) {
        this.semanasGlobal = data.ventanaHabilitacionSemanas;
      }
    });
  }

  toggleEspecialista(id: string) {
    this.espExpandedId = this.espExpandedId === id ? null : id;

    if (this.espExpandedId) {
      this.adminService.obtenerAgendaEspecialista(id)
        .subscribe((data: any) => {
          const esp = this.especialistas.find(e => e.id === id);

          if (!esp) return;

          // Asegurar estructura SIEMPRE
          if (!esp.config) {
            esp.config = {
              intervaloAtencion: 30,
              horarioAtencion: {
                horaInicio: '',
                horaFin: '',
                diaSemana: []
              }
            };
          }

          // Si backend devuelve datos, los usamos
          if (data) {
            console.log('CONFIG ESPECIALISTA:', data);
            esp.config = {
              intervaloAtencion: data.intervaloAtencion ?? 30,
              horarioAtencion: {
                horaInicio: data.horarioAtencion?.horaInicio ?? '',
                horaFin: data.horarioAtencion?.horaFin ?? '',
                diaSemana: data.horarioAtencion?.diaSemana ?? []
              }
            };
          }
        });
    }
  }

  ajustarSemanas(valor: number) {
    if (this.semanasGlobal + valor >= 1 && this.semanasGlobal + valor <= 52) {
      this.semanasGlobal += valor;
    }
  }

  guardarConfiguracionGlobal() {
    this.adminService.actualizarConfiguracionGlobal({
      ventanaHabilitacionSemanas: this.semanasGlobal
    }).subscribe(() => {
      Swal.fire({
        title: '¡Actualizado!',
        text: 'La configuración global ha sido actualizada.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido'
      })
    });
  }

  guardarEspecialista(esp: any) {
    if (!esp.config || !esp.config.horarioAtencion) {
      this.mensajeError('Falta configuración base del especialista');
      return;
    }

    const config = esp.config;

    // VALIDACIONES FRONT (evitan 400)
    if (!config.intervaloAtencion || config.intervaloAtencion < 5) {
      this.mensajeError('El intervalo debe ser de al menos 5 minutos.');
      return;
    }

    if (!config.horarioAtencion.horaInicio || !config.horarioAtencion.horaFin) {
      this.mensajeError('Debes seleccionar tanto la hora de inicio como la de fin.');
      return;
    }

    if (!config.horarioAtencion.diaSemana || config.horarioAtencion.diaSemana.length === 0) {
      this.mensajeError('Debes seleccionar al menos un día de atención.');
      return;
    }

    const payload = {
      intervaloAtencion: Number(config.intervaloAtencion), // 🔥 FORZAR NUMBER
      horarioAtencion: {
        horaInicio: config.horarioAtencion.horaInicio,
        horaFin: config.horarioAtencion.horaFin,
        diaSemana: config.horarioAtencion.diaSemana
      }
    };

    // Mostrar un "Cargando" mientras el backend responde
    Swal.fire({
      title: 'Guardando...',
      didOpen: () => { Swal.showLoading(); },
      allowOutsideClick: false
    });

    this.adminService.actualizarAgendaEspecialista(esp.id, payload)
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Actualizado!',
            text: `La agenda de ${esp.nombre} ha sido actualizada.`,
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('BACKEND:', err);
          console.error('DETALLE:', err.error); // AQUÍ SALE EL ERROR REAL
          this.mensajeError('Error al actualizar la agenda. Revisa la consola para más detalles.');
        }
      });
  }

  // Función auxiliar para no repetir código de errores
  private mensajeError(texto: string) {
    Swal.fire({
      title: 'Atención',
      text: texto,
      icon: 'warning',
      confirmButtonColor: '#ef4444' // Rojo para errores
    });
  }

  toggleDia(esp: any, dia: string) {

    // 🔥 Protección contra undefined
    if (!esp.config) {
      esp.config = {
        intervaloAtencion: 30,
        horarioAtencion: {
          horaInicio: '',
          horaFin: '',
          diaSemana: []
        }
      };
    }

    if (!esp.config.horarioAtencion) {
      esp.config.horarioAtencion = {
        horaInicio: '',
        horaFin: '',
        diaSemana: []
      };
    }

    if (!esp.config.horarioAtencion.diaSemana) {
      esp.config.horarioAtencion.diaSemana = [];
    }

    const dias = esp.config.horarioAtencion.diaSemana;

    if (dias.includes(dia)) {
      esp.config.horarioAtencion.diaSemana =
        dias.filter((d: string) => d !== dia);
    } else {
      dias.push(dia);
    }
  }
}
