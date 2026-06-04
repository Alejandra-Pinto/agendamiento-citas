import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HorarioGeneral } from '../../../../core/models/horario-general.model';

@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [],
  templateUrl: './horario.html',
  styleUrl: './horario.scss',
})
export class Horario {
  @Input() horario: HorarioGeneral[] = [];

  horarioResumen: { horaInicio: string; horaFin: string } | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['horario']) {
      this.calcularResumen();
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
  }
}
