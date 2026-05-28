/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

import { CalendarioRepository } from '../../domain/repositories/calendario.repository';
import { CalendarioClinica } from '../../domain/entities/calendario-clinica.entity';
import { ConfigurarDiaDto } from '../dto/configurar-dia.dto';

@Injectable()
export class ConfigurarDiaClinicaUseCase {
  constructor(
    private readonly calendarioRepo: CalendarioRepository,
  ) {}

  async ejecutar(dto: ConfigurarDiaDto): Promise<void> {
    const dia = new CalendarioClinica(new Date(dto.fecha), dto.habilitado);

    await this.calendarioRepo.guardar(dia);
  }
}
