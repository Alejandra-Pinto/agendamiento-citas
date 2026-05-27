/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { PacienteRepository } from '../../domain/repositories/paciente.repository';

@Injectable()
export class BuscarPacienteUseCase {
  private readonly logger = new Logger(
    BuscarPacienteUseCase.name,
  );

  constructor(
    @Inject('PacienteRepository')
    private readonly pacienteRepository: PacienteRepository,
  ) {}

  async ejecutar(documento: string) {

    this.logger.log(
      `Buscando paciente con documento ${documento}`,
    );

    const paciente =
      await this.pacienteRepository.findById(documento);

    if (paciente) {

      this.logger.log(
        `Paciente ${documento} encontrado correctamente`,
      );

    } else {

      this.logger.warn(
        `Paciente no encontrado con documento ${documento}`,
      );
    }

    return paciente;
  }

  async buscarPorTermino(termino: string) {

    this.logger.log(
      `Buscando pacientes por término: ${termino}`,
    );

    if (!termino) {

      this.logger.warn(
        'Búsqueda vacía de pacientes',
      );

      return [];
    }

    const resultados =
      await this.pacienteRepository.buscarPorTermino(
        termino,
      );

    this.logger.log(
      `Se encontraron ${resultados.length} pacientes para el término "${termino}"`,
    );

    return resultados;
  }
}
