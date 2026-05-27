/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class FinalizarCitaUseCase {
  private readonly logger = new Logger(FinalizarCitaUseCase.name);

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string) {
    this.logger.log(`Intentando finalizar cita ${citaId}`);

    const cita = await this.citaRepository.buscarPorId(citaId);

    if (!cita) {
      this.logger.warn(
        `Intento de finalizar cita inexistente: ${citaId}`,
      );

      throw new NotFoundException('Cita no encontrada');
    }

    // No finalizar canceladas o ya finalizadas
    if (
      cita.estado === EstadoCita.CANCELADA ||
      cita.estado === EstadoCita.FINALIZADA
    ) {
      this.logger.warn(
        `Intento inválido de finalizar cita ${citaId} con estado ${cita.estado}`,
      );

      throw new BadRequestException(
        'No puedes finalizar esta cita',
      );
    }

    // Validar fechas futuras
    const finDeHoy = new Date();
    finDeHoy.setHours(23, 59, 59, 999);

    const fechaCita = new Date(cita.fechaHora);

    if (fechaCita > finDeHoy) {
      this.logger.warn(
        `Intento de finalizar cita futura ${citaId}`,
      );

      throw new BadRequestException(
        'No puedes finalizar una cita de un día futuro',
      );
    }

    // Finalizar cita
    cita.finalizar();

    await this.citaRepository.guardar(cita);

    this.logger.log(
      `Cita ${citaId} finalizada correctamente`,
    );

    return cita;
  }
}
