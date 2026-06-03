import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../../../core/services/citas-service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-disponibilidad-doctores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disponibilidad-doctores.html',
})
export class DisponibilidadDoctores implements OnInit, OnDestroy {
  doctoresDisponibilidad: any[] = [];
  readonly MAX_CITAS = 50;
  fechaHoy: string = '';

  // Guardamos la suscripción para destruirla cuando el usuario cambie de pantalla
  private autoRefreshSub?: Subscription;

  constructor(private citasService: CitasService) {}

  ngOnInit() {
    this.actualizarFechaHoy();
    this.iniciarMonitoreoReactivo();
  }

  ngOnDestroy() {
    // CRUCIAL: Evita fugas de memoria (memory leaks) cancelando el temporizador
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
  }

  private actualizarFechaHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.fechaHoy = `${anio}-${mes}-${dia}`;
  }

  iniciarMonitoreoReactivo() {
    this.autoRefreshSub = timer(0, 2000)
      .pipe(
        switchMap(() => this.citasService.getCitasParaDashboard()),
      )
      .subscribe({
        next: (citas: any[]) => {
          this.procesarCitasDiarias(citas);
        },
        error: (err) => console.error('Error actualizando disponibilidad:', err),
      });
  }

  private procesarCitasDiarias(citas: any[]) {
    const conteoMap = new Map<string, number>();

    citas.forEach((cita) => {
      const nombreDoc = cita.especialista?.nombre || cita.especialista?.apellido || 'Médico';
      if (!conteoMap.has(nombreDoc)) {
        conteoMap.set(nombreDoc, 0); // Todos arrancan el día en 0 citas
      }
    });

    citas.forEach((cita) => {
      if (!cita.fechaHora) return;

      const fechaLocal = new Date(cita.fechaHora);
      const anio = fechaLocal.getFullYear();
      const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaLocal.getDate()).padStart(2, '0');
      const fechaCitaLocal = `${anio}-${mes}-${dia}`;

      if (fechaCitaLocal === this.fechaHoy) {
        const nombreDoc = cita.especialista?.nombre || cita.especialista?.apellido || 'Médico';
        const actual = conteoMap.get(nombreDoc) || 0;
        conteoMap.set(nombreDoc, actual + 1);
      }
    });

    this.doctoresDisponibilidad = Array.from(conteoMap, ([nombre, total]) => ({
      nombre,
      citasAgendadas: total,
    })).sort((a, b) => b.citasAgendadas - a.citasAgendadas);
  }

  getBarColor(citas: number): string {
    const porcentaje = (citas / this.MAX_CITAS) * 100;
    if (porcentaje >= 80) return 'bg-red-500';
    if (porcentaje >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  calcularPorcentaje(citas: number): number {
    const porcentaje = (citas / this.MAX_CITAS) * 100;
    return porcentaje > 100 ? 100 : porcentaje;
  }
}
