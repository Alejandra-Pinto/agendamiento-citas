/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { EspecialistaRepository } from '../../domain/repositories/especialista.repository';

@Injectable()
export class ListarEspecialistasUseCase {
  private readonly logger = new Logger(
    ListarEspecialistasUseCase.name,
  );

  constructor(
    @Inject('EspecialistaRepository')
    private readonly especialistaRepository: EspecialistaRepository,
  ) {}

  async ejecutar() {

    this.logger.log(
      'Consultando listado de especialistas',
    );

    const especialistas =
      await this.especialistaRepository.findAll();

    this.logger.log(
      `Se encontraron ${especialistas.length} especialistas registrados`,
    );

    return especialistas;
  }
}
