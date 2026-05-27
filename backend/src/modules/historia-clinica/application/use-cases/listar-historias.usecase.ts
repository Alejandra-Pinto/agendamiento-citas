/* eslint-disable prettier/prettier */
import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';

import type { HistoriaClinicaRepository } from '../../domain/repositories/historia-clinica.repository';
import { HistoriaClinica } from '../../domain/entities/historia-clinica.entity';

@Injectable()
export class ListarHistoriasUseCase {
  private readonly logger = new Logger(
    ListarHistoriasUseCase.name,
  );

  constructor(
    @Inject('HistoriaClinicaRepository')
    private readonly repository: HistoriaClinicaRepository,
  ) {}

  async ejecutar(): Promise<HistoriaClinica[]> {

    this.logger.log(
      'Consultando todas las historias clínicas',
    );

    const historias =
      await this.repository.listarTodas();

    this.logger.log(
      `Se encontraron ${historias.length} historias clínicas registradas`,
    );

    return historias;
  }
}