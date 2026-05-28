/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import { CalendarioRepository } from '../../../administrador/domain/repositories/calendario.repository';

@Injectable()
export class CalendarioClinicaService {
  constructor(
    private readonly calendarioRepo: CalendarioRepository,
  ) {}

  async estaDisponible(
    fecha: Date,
  ): Promise<boolean> {
    const excepcion =
      await this.calendarioRepo.buscarPorFecha(
        fecha,
      );

    if (excepcion) {
      return excepcion.habilitado;
    }

    const dia = fecha.getDay();

    // domingo = 0
    // sábado = 6

    return dia !== 0 && dia !== 6;
  }
}
