/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { Cita, EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class MarcarNoAsistioUseCase {
  private readonly logger = new Logger(MarcarNoAsistioUseCase.name);

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string): Promise<Cita> {
    this.logger.log(
      `Intentando marcar como no asistió la cita ${citaId}`,
    );

    const cita = await this.citaRepository.buscarPorId(citaId);

    if (!cita) {
      this.logger.warn(
        `Intento de marcar no asistencia en cita inexistente: ${citaId}`,
      );

      throw new NotFoundException('Cita no encontrada');
    }

    // No permitir marcar si ya fue cancelada o finalizada
    if (
      cita.estado === EstadoCita.CANCELADA ||
      cita.estado === EstadoCita.FINALIZADA
    ) {
      this.logger.warn(
        `Intento inválido de marcar no asistencia para cita ${citaId} con estado ${cita.estado}`,
      );

      throw new BadRequestException(
        'No se puede marcar como no asistió',
      );
    }

    const ahora = new Date().getTime();
    const inicio = new Date(cita.fechaHora).getTime();

    // No permitir antes de que ocurra
    if (ahora < inicio) {
      this.logger.warn(
        `Intento de marcar no asistencia antes de la cita ${citaId}`,
      );

      throw new BadRequestException('La cita aún no ocurre');
    }

    // Cambiar estado
    cita.marcarNoAsistio();

    await this.citaRepository.guardar(cita);

    this.logger.log(
      `Cita ${citaId} marcada como no asistió correctamente`,
    );

    return cita;
  }
}
