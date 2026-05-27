/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  EspecialistaAgendaPort,
  HorarioData,
} from '../../domain/ports/especialista-agenda.port';

@Injectable()
export class ConfigurarAgendaUseCase {
  private readonly logger = new Logger(
    ConfigurarAgendaUseCase.name,
  );

  constructor(
    private readonly especialistaPort: EspecialistaAgendaPort,
  ) {}

  async execute(
    id: string,
    intervalo: number,
    horario: HorarioData,
  ) {

    this.logger.log(
      `Configurando agenda del especialista ${id}`,
    );

    this.logger.log(
      `Nuevo intervalo de atención: ${intervalo} minutos`,
    );

    const resultado =
      await this.especialistaPort.actualizarConfiguracion(
        id,
        intervalo,
        horario,
      );

    this.logger.log(
      `Agenda del especialista ${id} configurada correctamente`,
    );

    return resultado;
  }
}
