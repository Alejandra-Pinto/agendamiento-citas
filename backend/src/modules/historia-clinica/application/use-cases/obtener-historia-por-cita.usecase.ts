/* eslint-disable prettier/prettier */
// src/modules/agendamiento/application/use-cases/exportar-citas.use-case.ts

import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { HistoriaClinicaRepository } from '../../domain/repositories/historia-clinica.repository';
import { HistoriaClinica } from '../../domain/entities/historia-clinica.entity';

@Injectable()
export class ObtenerHistoriaPorCitaUseCase {
  private readonly logger = new Logger(
    ObtenerHistoriaPorCitaUseCase.name,
  );

  constructor(
    @Inject('HistoriaClinicaRepository')
    private readonly repository: HistoriaClinicaRepository,
  ) {}

  async ejecutar(
    citaId: string,
  ): Promise<HistoriaClinica | null> {

    this.logger.log(
      `Consultando historia clínica asociada a la cita ${citaId}`,
    );

    const historia =
      await this.repository.buscarPorCita(citaId);

    if (historia) {

      this.logger.log(
        `Historia clínica encontrada para cita ${citaId}`,
      );

    } else {

      this.logger.warn(
        `No existe historia clínica asociada a la cita ${citaId}`,
      );
    }

    return historia;
  }
}