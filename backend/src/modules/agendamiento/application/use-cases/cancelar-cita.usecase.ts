/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity';

@Injectable()
export class CancelarCitaUseCase {
  private readonly logger = new Logger(CancelarCitaUseCase.name);

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(id: string) {
    this.logger.log(`Intentando cancelar cita ${id}`);

    const data = await this.citaRepository.buscarPorId(id);

    if (!data) {
      this.logger.warn(`Intento de cancelar cita inexistente: ${id}`);

      throw new NotFoundException('Cita no encontrada');
    }

    const cita = new Cita(
      data.id,
      data.pacienteId,
      data.especialistaId,
      data.fechaHora,
      data.duracion,
      data.tipo,
      data.estado,
    );

    try {
      cita.cancelar();

      await this.citaRepository.guardar(cita);

      this.logger.log(`Cita ${id} cancelada correctamente`);

      return cita;
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(
        `Error al cancelar cita ${id}: ${mensaje}`,
      );

      throw new BadRequestException(mensaje);
    }
  }
}
