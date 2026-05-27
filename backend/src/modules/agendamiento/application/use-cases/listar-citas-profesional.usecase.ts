/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity';

@Injectable()
export class ListarCitasProfesionalUseCase {
  private readonly logger = new Logger(
    ListarCitasProfesionalUseCase.name,
  );

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(
    especialistaId: string,
    fecha?: string,
  ): Promise<Cita[]> {

    this.logger.log(
      `Consultando citas del especialista ${especialistaId}`,
    );

    // 1. Validar especialistaId
    if (!especialistaId || especialistaId.trim() === '') {

      this.logger.warn(
        'Intento de consulta sin ID de especialista',
      );

      throw new BadRequestException(
        'El ID del especialista es requerido',
      );
    }

    // 2. Fecha actual por defecto
    const fechaConsulta = fecha || this.obtenerFechaActual();

    // 3. Validar formato fecha
    if (fecha && !this.esFechaValida(fecha)) {

      this.logger.warn(
        `Formato de fecha inválido recibido: ${fecha}`,
      );

      throw new BadRequestException(
        'Formato de fecha inválido. Use YYYY-MM-DD',
      );
    }

    this.logger.log(
      `Buscando citas para especialista ${especialistaId} en fecha ${fechaConsulta}`,
    );

    // 4. Obtener citas
    const citas = await this.citaRepository.buscarPorProfesionalYFecha(
      especialistaId,
      fechaConsulta,
    );

    this.logger.log(
      `Se encontraron ${citas.length} citas para especialista ${especialistaId}`,
    );

    // 5. Ordenar citas
    return this.ordenarCitasPorHora(citas);
  }

  private obtenerFechaActual(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private esFechaValida(fecha: string): boolean {
    // Validar formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(fecha)) return false;

    const date = new Date(fecha);

    return date instanceof Date && !isNaN(date.getTime());
  }

  private ordenarCitasPorHora(citas: Cita[]): Cita[] {
    return [...citas].sort((a, b) => {
      const horaA = new Date(a.fechaHora).getTime();
      const horaB = new Date(b.fechaHora).getTime();

      return horaA - horaB;
    });
  }
}
