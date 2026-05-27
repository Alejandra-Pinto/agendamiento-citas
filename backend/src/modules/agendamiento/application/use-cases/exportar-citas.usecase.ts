/* eslint-disable prettier/prettier */
// src/modules/agendamiento/application/use-cases/exportar-citas.use-case.ts

import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { ExportadorCitasPort } from '../../domain/ports/exportador-citas.port';

@Injectable()
export class ExportarCitasUseCase {
  private readonly logger = new Logger(ExportarCitasUseCase.name);

  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,

    private readonly exportador: ExportadorCitasPort,
  ) {}

  async ejecutar(
    especialistaId: string,
    fecha: string,
    formato: 'pdf' | 'excel',
  ): Promise<Buffer> {

    this.logger.log(
      `Iniciando exportación de citas para especialista ${especialistaId} en formato ${formato}`,
    );

    const citas = await this.citaRepository.buscarPorProfesionalYFecha(
      especialistaId,
      fecha,
    );

    this.logger.log(
      `Se encontraron ${citas.length} citas para exportar`,
    );

    if (formato === 'excel') {

      this.logger.log(
        `Generando archivo Excel para especialista ${especialistaId}`,
      );

      return await this.exportador.generarExcel(citas);
    }

    this.logger.log(
      `Generando archivo PDF para especialista ${especialistaId}`,
    );

    return await this.exportador.generarPdf(citas);
  }
}
