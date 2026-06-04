import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorarioGeneral } from '../../../../core/models/horario-general.model';

@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario.html',
  styleUrl: './horario.scss',
})
export class Horario {
  @Input() horario: HorarioGeneral[] = [];

  horarioResumen: { horaInicio: string; horaFin: string } | null = null;
  isOpen = false;

  ngOnInit() {
    this.checkOpenStatus();

    // opcional: actualizar cada minuto
    setInterval(() => {
      this.checkOpenStatus();
    }, 60000);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['horario']) {
      this.calcularResumen();
      this.checkOpenStatus();
    }
  }

  calcularResumen() {
    if (!this.horario?.length) return;

    const inicio = this.horario.reduce((min, h) =>
      h.horaInicio < min ? h.horaInicio : min,
      this.horario[0].horaInicio
    );

    const fin = this.horario.reduce((max, h) =>
      h.horaFin > max ? h.horaFin : max,
      this.horario[0].horaFin
    );

    this.horarioResumen = { horaInicio: inicio, horaFin: fin };

    this.checkOpenStatus();
  }

  checkOpenStatus() {
    const now = new Date();

    console.log('NOW:', now);
    console.log('HORARIO:', this.horarioResumen);

    if (!this.horarioResumen) return;

    const currentMinutes = this.toMinutes(
      `${now.getHours()}:${now.getMinutes()}`
    );

    const start = this.toMinutes(this.horarioResumen.horaInicio);
    const end = this.toMinutes(this.horarioResumen.horaFin);

    this.isOpen = currentMinutes >= start && currentMinutes < end;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
