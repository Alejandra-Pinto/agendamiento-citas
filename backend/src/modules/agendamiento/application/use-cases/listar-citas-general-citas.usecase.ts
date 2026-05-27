/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class ListarTodasLasCitasUseCase {
  private readonly logger = new Logger(
    ListarTodasLasCitasUseCase.name,
  );

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar() {
    this.logger.log('Consultando todas las citas registradas');

    const citas = await this.citaRepository.buscarTodas();

    this.logger.log(
      `Se encontraron ${citas.length} citas registradas`,
    );

    return citas;
  }
}
