/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { PacienteRepository } from '../../domain/repositories/paciente.repository';

@Injectable()
export class ListarPacientesUseCase {
  private readonly logger = new Logger(
    ListarPacientesUseCase.name,
  );

  constructor(
    @Inject('PacienteRepository')
    private readonly pacienteRepository: PacienteRepository,
  ) {}

  async ejecutar() {

    this.logger.log(
      'Consultando listado de pacientes',
    );

    const pacientes =
      await this.pacienteRepository.findAll();

    this.logger.log(
      `Se encontraron ${pacientes.length} pacientes registrados`,
    );

    return pacientes;
  }
}
