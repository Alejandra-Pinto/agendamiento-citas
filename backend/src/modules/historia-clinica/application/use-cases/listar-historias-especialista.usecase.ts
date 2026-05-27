/* eslint-disable prettier/prettier */
import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';

import type { HistoriaClinicaRepository } from '../../domain/repositories/historia-clinica.repository';
import { HistoriaClinica } from '../../domain/entities/historia-clinica.entity';

@Injectable()
export class ListarHistoriasEspecialistaUseCase {
  private readonly logger = new Logger(
    ListarHistoriasEspecialistaUseCase.name,
  );

  constructor(
    @Inject('HistoriaClinicaRepository')
    private readonly repository: HistoriaClinicaRepository,
  ) {}

  async ejecutar(
    EspecialistaId: string,
  ): Promise<HistoriaClinica[]> {

    this.logger.log(
      `Consultando historias clínicas del especialista ${EspecialistaId}`,
    );

    const historias =
      await this.repository.listarPorEspecialista(
        EspecialistaId,
      );

    this.logger.log(
      `Se encontraron ${historias.length} historias clínicas para el especialista ${EspecialistaId}`,
    );

    return historias;
  }
}
