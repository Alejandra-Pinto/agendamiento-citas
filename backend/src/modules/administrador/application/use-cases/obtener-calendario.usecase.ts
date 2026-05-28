/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import { CalendarioRepository } from '../../domain/repositories/calendario.repository';

@Injectable()
export class ObtenerCalendarioUseCase {
  constructor(
    private readonly calendarioRepo: CalendarioRepository,
  ) {}

  async ejecutar(anio: number, mes: number) {
    return this.calendarioRepo.listarPorMes(
      anio,
      mes,
    );
  }
}
