/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { EspecialistaRepository } from '../../domain/repositories/especialista.repository';
import { HorarioAtencion } from '../../domain/entities/especialista.entity';

@Injectable()
export class ConfigurarAgendaEspecialistaUseCase {
  private readonly logger = new Logger(
    ConfigurarAgendaEspecialistaUseCase.name,
  );

  constructor(
    @Inject('EspecialistaRepository')
    private readonly repository: EspecialistaRepository,
  ) {}

  async execute(
    id: string,
    nuevoIntervalo: number,
    nuevosHorarios: HorarioAtencion,
  ) {

    this.logger.log(
      `Intentando actualizar configuración de agenda del especialista ${id}`,
    );

    const especialista = await this.repository.findById(id);

    if (!especialista) {

      this.logger.warn(
        `Especialista no encontrado: ${id}`,
      );

      throw new NotFoundException(
        `El especialista con ID ${id} no existe en Piedra Azul`,
      );
    }

    this.logger.log(
      `Actualizando intervalo de atención a ${nuevoIntervalo} minutos`,
    );

    // Ejecutar lógica de dominio
    especialista.actualizarConfiguracionAgenda(
      nuevoIntervalo,
      nuevosHorarios,
    );

    // Persistir cambios
    await this.repository.update(especialista);

    this.logger.log(
      `Configuración de agenda actualizada correctamente para especialista ${id}`,
    );

    return {
      message: 'Configuración de agenda actualizada con éxito',
      especialistaId: especialista.id,
    };
  }
}
