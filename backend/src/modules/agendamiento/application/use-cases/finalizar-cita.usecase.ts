import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class FinalizarCitaUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string) {
    const cita = await this.citaRepository.buscarPorId(citaId);

    if (!cita) throw new NotFoundException('Cita no encontrada');

    // No finalizar canceladas o ya finalizadas
    if (
      cita.estado === EstadoCita.CANCELADA ||
      cita.estado === EstadoCita.FINALIZADA
    ) {
      throw new BadRequestException('No puedes finalizar esta cita');
    }

    const ahora = new Date().getTime();
    const inicio = new Date(cita.fechaHora).getTime();
    const fin = inicio + cita.duracion * 60000;

    if (ahora < fin) {
      throw new BadRequestException(
        'No puedes finalizar una cita que aún no ocurre',
      );
    }

    // Finalizar
    cita.finalizar();
    await this.citaRepository.guardar(cita);

    return cita;
  }
}
