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
export class ReagendarCitaUseCase {
  private readonly logger = new Logger(ReagendarCitaUseCase.name);

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string, nuevaFecha: Date) {
    this.logger.log(
      `Intentando reagendar cita ${citaId} para ${nuevaFecha.toISOString()}`,
    );

    const data = await this.citaRepository.buscarPorId(citaId);

    if (!data) {
      this.logger.warn(
        `Intento de reagendar cita inexistente: ${citaId}`,
      );

      throw new NotFoundException('Cita no encontrada');
    }

    // Rehidratación
    const cita = new Cita(
      data.id,
      data.pacienteId,
      data.especialistaId,
      data.fechaHora,
      data.duracion,
      data.tipo,
      data.estado,
    );

    // Verificar si es misma fecha
    const esMismaFechaOriginal =
      new Date(data.fechaHora).getTime() ===
      new Date(nuevaFecha).getTime();

    if (!esMismaFechaOriginal) {
      // No reagendar canceladas o finalizadas
      if (
        cita.estado === EstadoCita.CANCELADA ||
        cita.estado === EstadoCita.FINALIZADA
      ) {
        this.logger.warn(
          `Intento inválido de reagendar cita ${citaId} con estado ${cita.estado}`,
        );

        throw new BadRequestException(
          'No puedes reagendar esta cita',
        );
      }

      // No permitir pasado
      if (nuevaFecha < new Date()) {
        this.logger.warn(
          `Intento de reagendar cita ${citaId} a una fecha pasada`,
        );

        throw new BadRequestException(
          'No puedes reagendar al pasado',
        );
      }

      // Validar horario comercial
      const hora = nuevaFecha.getHours();

      if (hora < 8 || hora >= 18) {
        this.logger.warn(
          `Intento de reagendar cita ${citaId} fuera del horario de atención`,
        );

        throw new BadRequestException(
          'Fuera del horario de atención',
        );
      }
    }

    // Validar conflictos
    const fecha = nuevaFecha.toISOString().split('T')[0];

    const citas = await this.citaRepository.buscarPorProfesionalYFecha(
      cita.especialistaId,
      fecha,
    );

    const nuevaInicio = nuevaFecha.getTime();
    const nuevaFin = nuevaInicio + cita.duracion * 60000;

    const conflicto = citas.some((c) => {
      if (c.id === cita.id) return false;

      const inicioExistente = new Date(c.fechaHora).getTime();
      const finExistente = inicioExistente + c.duracion * 60000;

      return nuevaInicio < finExistente && nuevaFin > inicioExistente;
    });

    if (conflicto) {
      this.logger.warn(
        `Conflicto de horario al reagendar cita ${citaId}`,
      );

      throw new BadRequestException('Horario no disponible');
    }

    // Reagendar
    cita.reagendar(nuevaFecha);

    await this.citaRepository.guardar(cita);

    this.logger.log(
      `Cita ${citaId} reagendada correctamente para ${nuevaFecha.toISOString()}`,
    );

    return cita;
  }
}
