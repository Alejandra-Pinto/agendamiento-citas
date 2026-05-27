import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cita, EstadoCita } from '../../domain/entities/cita.entity'; // Importamos Cita (la clase)
import type { CitaRepository } from '../../domain/repositories/cita.repository';

@Injectable()
export class ReagendarCitaUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(citaId: string, nuevaFecha: Date) {
    const data = await this.citaRepository.buscarPorId(citaId);

    if (!data) throw new NotFoundException('Cita no encontrada');

    // --- REHIDRATACIÓN ---
    // Convertimos los datos planos en una instancia de la entidad Cita
    const cita = new Cita(
      data.id,
      data.pacienteId,
      data.especialistaId,
      data.fechaHora,
      data.duracion,
      data.tipo,
      data.estado,
    );

    // Identificamos si es una reversión por error (el usuario mantiene exactamente la misma fecha y hora original)
    const esMismaFechaOriginal =
      new Date(data.fechaHora).getTime() === new Date(nuevaFecha).getTime();

    // Las validaciones de negocio estrictas solo se ejecutan si pretenden cambiar la fecha de verdad
    if (!esMismaFechaOriginal) {
      // No reagendar canceladas o finalizadas de forma ordinaria
      if (
        cita.estado === EstadoCita.CANCELADA ||
        cita.estado === EstadoCita.FINALIZADA
      ) {
        throw new BadRequestException('No puedes reagendar esta cita');
      }

      // No permitir reprogramar al pasado
      if (nuevaFecha < new Date()) {
        throw new BadRequestException('No puedes reagendar al pasado');
      }

      // Validar horario comercial (8 a 18)
      const hora = nuevaFecha.getHours();
      if (hora < 8 || hora >= 18) {
        throw new BadRequestException('Fuera del horario de atención');
      }
    }

    // Traer citas del mismo día para validar solapamiento (Esta lógica se ejecuta siempre para evitar colisiones accidentales)
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
      throw new BadRequestException('Horario no disponible');
    }

    // --- AHORA SÍ FUNCIONARÁ ---
    // Modifica internamente el estado de la cita de vuelta a PROGRAMADA (según tu método del dominio)
    cita.reagendar(nuevaFecha);

    await this.citaRepository.guardar(cita);

    return cita;
  }
}
