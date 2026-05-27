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

    // --- MODIFICACIÓN DE LA REGLA (OPCIÓN A) ---
    // Creamos un objeto con la fecha/hora actual y calculamos el límite del día de hoy (23:59:59)
    const finDeHoy = new Date();
    finDeHoy.setHours(23, 59, 59, 999);

    // Convertimos la fecha de la cita para evaluar su día
    const fechaCita = new Date(cita.fechaHora);

    // Si la cita está agendada para después de hoy, rebotamos la acción
    if (fechaCita > finDeHoy) {
      throw new BadRequestException(
        'No puedes finalizar una cita de un día futuro', // <-- Deja este texto exacto
      );
    }

    // Finalizar
    cita.finalizar();
    await this.citaRepository.guardar(cita);

    return cita;
  }
}
