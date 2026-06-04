/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { HorarioGeneralDto } from '../../application/dto/horario-general.dto';
import { HorarioData } from '../ports/especialista-agenda.port';

@Injectable()
export class HorarioGeneralService {
  calcular(agendas: HorarioData[]): HorarioGeneralDto[] {
    const resultado = new Map<
      string,
      { horaInicio: string; horaFin: string }
    >();

    for (const agenda of agendas) {
        if (!agenda?.diaSemana?.length) continue;

        for (const dia of agenda.diaSemana) {

            const existente = resultado.get(dia);

            if (!existente) {
            resultado.set(dia, {
                horaInicio: agenda.horaInicio,
                horaFin: agenda.horaFin,
            });
            continue;
            }

            // 👇 AQUÍ VA LA NUEVA LÓGICA
            const inicioActual = this.toMinutes(agenda.horaInicio);
            const inicioExistente = this.toMinutes(existente.horaInicio);

            if (inicioActual < inicioExistente) {
            existente.horaInicio = agenda.horaInicio;
            }

            const finActual = this.toMinutes(agenda.horaFin);
            const finExistente = this.toMinutes(existente.horaFin);

            if (finActual > finExistente) {
            existente.horaFin = agenda.horaFin;
            }
        }
        }

    return Array.from(resultado.entries()).map(
      ([dia, horario]) => ({
        dia,
        horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      }),
    );
  }
  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
    }
}