/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { Cita, EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';
import {
  ConsultarCitasDto,
  TipoConsultaCita,
} from '../dto/consultar-cita.dto';

@Injectable()
export class ObtenerCitasUseCase {
  private readonly logger = new Logger(
    ObtenerCitasUseCase.name,
  );

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(dto: ConsultarCitasDto): Promise<Cita[]> {

    this.logger.log(
      `Consultando citas con filtros: ${JSON.stringify(dto)}`,
    );

    // 1. Obtener citas desde DB
    const citas = await this.citaRepository.buscarTodas(dto);

    this.logger.log(
      `Se encontraron ${citas.length} citas antes de aplicar filtros`,
    );

    // 2. Buscar cita específica por ID
    if (dto.id && citas.length > 0) {

      this.logger.log(
        `Consulta específica de cita con ID ${dto.id}`,
      );

      return [citas[0]];
    }

    const ahora = new Date();

    // 3. Aplicar filtros
    switch (dto.tipo) {

      case TipoConsultaCita.PROXIMAS:

        this.logger.log(
          'Aplicando filtro de próximas citas',
        );

        return citas.filter(
          (c) =>
            c.fechaHora > ahora &&
            c.estado === EstadoCita.PROGRAMADA,
        );

      case TipoConsultaCita.CANCELADAS:

        this.logger.log(
          'Aplicando filtro de citas canceladas',
        );

        return citas.filter(
          (c) => c.estado === EstadoCita.CANCELADA,
        );

      case TipoConsultaCita.PROGRAMADAS:

        this.logger.log(
          'Aplicando filtro de citas programadas',
        );

        return citas.filter(
          (c) => c.estado === EstadoCita.PROGRAMADA,
        );

      case TipoConsultaCita.REAGENDADAS:

        this.logger.log(
          'Aplicando filtro de citas reagendadas',
        );

        return citas.filter(
          (c) => c.estado === EstadoCita.REAGENDADA,
        );

      case TipoConsultaCita.FINALIZADAS:

        this.logger.log(
          'Aplicando filtro de citas finalizadas',
        );

        return citas.filter(
          (c) => c.estado === EstadoCita.FINALIZADA,
        );

      case TipoConsultaCita.NO_ASISTIO:

        this.logger.log(
          'Aplicando filtro de citas no asistidas',
        );

        return citas.filter(
          (c) => c.estado === EstadoCita.NO_ASISTIO,
        );

      case TipoConsultaCita.TODAS:
      default:

        this.logger.log(
          'Retornando todas las citas sin filtro adicional',
        );

        return citas;
    }
  }
}
