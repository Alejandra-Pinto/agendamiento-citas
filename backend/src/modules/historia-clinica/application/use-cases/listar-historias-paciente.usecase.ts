/* eslint-disable prettier/prettier */
import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';

import type { HistoriaClinicaRepository } from '../../domain/repositories/historia-clinica.repository';
import { HistoriaClinica } from '../../domain/entities/historia-clinica.entity';

@Injectable()
export class ListarHistoriasPacienteUseCase {
  private readonly logger = new Logger(
    ListarHistoriasPacienteUseCase.name,
  );

  constructor(
    @Inject('HistoriaClinicaRepository')
    private readonly repository: HistoriaClinicaRepository,
  ) {}

  async ejecutar(
    pacienteId: string,
  ): Promise<HistoriaClinica[]> {

    this.logger.log(
      `Consultando historias clínicas del paciente ${pacienteId}`,
    );

    const historias =
      await this.repository.listarPorPaciente(
        pacienteId,
      );

    this.logger.log(
      `Se encontraron ${historias.length} historias clínicas para el paciente ${pacienteId}`,
    );

    return historias;
  }
}