/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { HistoriaClinica } from '../../domain/entities/historia-clinica.entity';
import type { HistoriaClinicaRepository } from '../../domain/repositories/historia-clinica.repository';
import { CrearHistoriaDto } from '../dto/crear-historia.dto';
import { randomUUID } from 'crypto';
import type { CitaPort } from '../../domain/ports/cita.port';
import type { EspecialistaPort } from '../../domain/ports/especialista.port';
import type { PacientePort } from '../../domain/ports/paciente.port';

@Injectable()
export class CrearHistoriaUseCase {
  private readonly logger = new Logger(
    CrearHistoriaUseCase.name,
  );

  constructor(
    @Inject('HistoriaClinicaRepository')
    private readonly repository: HistoriaClinicaRepository,

    @Inject('CitaPort')
    private readonly citaPort: CitaPort,

    @Inject('EspecialistaPort')
    private readonly especialistaPort: EspecialistaPort,

    @Inject('PacientePort')
    private readonly pacientePort: PacientePort,
  ) {}

  async ejecutar(
    dto: CrearHistoriaDto,
  ): Promise<HistoriaClinica> {

    this.logger.log(
      `Intentando crear historia clínica para cita ${dto.citaId}`,
    );

    // Validar cita
    const existeCita =
      await this.citaPort.obtenerPorId(dto.citaId);

    if (!existeCita) {

      this.logger.warn(
        `Cita no encontrada: ${dto.citaId}`,
      );

      throw new NotFoundException(
        'La cita no existe',
      );
    }

    // Validar especialista
    const existeProfesional =
      await this.especialistaPort.obtenerPorId(
        dto.especialistaId,
      );

    if (!existeProfesional) {

      this.logger.warn(
        `Especialista inválido: ${dto.especialistaId}`,
      );

      throw new BadRequestException(
        'Especialista no válido',
      );
    }

    // Validar paciente
    const existePaciente =
      await this.pacientePort.obtenerPorId(
        dto.pacienteId,
      );

    if (!existePaciente) {

      this.logger.warn(
        `Paciente inválido: ${dto.pacienteId}`,
      );

      throw new BadRequestException(
        'Paciente no válido',
      );
    }

    // Crear historia clínica
    const historia = new HistoriaClinica(
      randomUUID(),
      dto.citaId,
      dto.pacienteId,
      dto.especialistaId,
      new Date(),
      dto.descripcion,
    );

    this.logger.log(
      `Historia clínica generada para paciente ${dto.pacienteId}`,
    );

    // Guardar
    await this.repository.guardar(historia);

    this.logger.log(
      `Historia clínica almacenada correctamente para cita ${dto.citaId}`,
    );

    return historia;
  }
}
