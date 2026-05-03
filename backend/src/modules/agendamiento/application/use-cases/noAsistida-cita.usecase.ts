import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cita, EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class MarcarNoAsistioUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string): Promise<Cita> {
    const cita = await this.citaRepository.buscarPorId(citaId);

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    //No permitir marcar si ya fue cancelada o finalizada
    if (
      cita.estado === EstadoCita.CANCELADA ||
      cita.estado === EstadoCita.FINALIZADA
    ) {
      throw new BadRequestException('No se puede marcar como no asistió');
    }

    const ahora = new Date().getTime();
    const inicio = new Date(cita.fechaHora).getTime();

    //No permitir antes de que ocurra
    if (ahora < inicio) {
      throw new BadRequestException('La cita aún no ocurre');
    }

    // ✔ Cambiar estado
    cita.marcarNoAsistio();

    await this.citaRepository.guardar(cita);

    return cita;
  }
}
