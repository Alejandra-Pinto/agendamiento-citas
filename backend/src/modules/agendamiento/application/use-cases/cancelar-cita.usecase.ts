import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity';

@Injectable()
export class CancelarCitaUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(id: string) {
    const data = await this.citaRepository.buscarPorId(id);

    if (!data) {
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
      return cita;
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(mensaje);
    }
  }
}
