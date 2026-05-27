/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { EspecialistaAgendaPort } from '../../domain/ports/especialista-agenda.port';

@Injectable()
export class ObtenerAgendaEspecialistaUseCase {
  private readonly logger = new Logger(
    ObtenerAgendaEspecialistaUseCase.name,
  );

  constructor(
    private readonly especialistaPort: EspecialistaAgendaPort,
  ) {}

  async execute(id: string) {

    this.logger.log(
      `Consultando agenda del especialista ${id}`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const datos = await this.especialistaPort.obtenerPorId(id);

    if (!datos) {

      this.logger.warn(
        `Especialista no encontrado: ${id}`,
      );

      throw new NotFoundException(
        `No se encontró el especialista con ID ${id}`,
      );
    }

    this.logger.log(
      `Agenda del especialista ${id} obtenida correctamente`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return datos;
  }
}
