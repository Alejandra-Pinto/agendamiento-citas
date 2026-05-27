/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';
import type { EspecialistaPort } from '../../domain/ports/especialista.port';
import { DisponibilidadAgendamientoService } from '../../domain/services/disponibilidad-agendamiento.service';

@Injectable()
export class ObtenerDisponibilidadUseCase {
  private readonly logger = new Logger(
    ObtenerDisponibilidadUseCase.name,
  );

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,

    @Inject('EspecialistaPort')
    private readonly especialistaPort: EspecialistaPort,

    private readonly disponibilidadService: DisponibilidadAgendamientoService,
  ) {}

  async ejecutar(especialistaId: string, fecha: string) {

    this.logger.log(
      `Consultando disponibilidad del especialista ${especialistaId} para fecha ${fecha}`,
    );

    // 1. Validar ventana permitida
    const fechaDate = new Date(fecha + 'T00:00:00');

    const esValida =
      await this.disponibilidadService.estaEnVentanaPermitida(
        fechaDate,
      );

    if (!esValida) {

      this.logger.warn(
        `Fecha fuera de ventana permitida: ${fecha}`,
      );

      throw new BadRequestException(
        'La fecha solicitada no está habilitada para agendamiento',
      );
    }

    // 2. Obtener especialista
    const especialista =
      await this.especialistaPort.obtenerPorId(
        especialistaId,
      );

    if (!especialista || !especialista.activo) {

      this.logger.warn(
        `Especialista no encontrado o inactivo: ${especialistaId}`,
      );

      throw new BadRequestException(
        'Especialista no encontrado o inactivo',
      );
    }

    // 3. Obtener citas ocupadas
    const citas =
      await this.citaRepository.buscarPorProfesionalYFecha(
        especialistaId,
        fecha,
      );

    this.logger.log(
      `Se encontraron ${citas.length} citas ocupadas para el especialista ${especialistaId}`,
    );

    // 4. Calcular disponibilidad
    const horarios =
      this.disponibilidadService.calcularHorariosDisponibles(
        especialista.intervaloAtencion,
        citas,
        fecha,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        especialista.horarioAtencion,
      );

    this.logger.log(
      `Se calcularon ${horarios.length} horarios disponibles`,
    );

    return horarios;
  }
}
