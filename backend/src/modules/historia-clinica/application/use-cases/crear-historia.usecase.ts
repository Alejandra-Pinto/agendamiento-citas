/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
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

  async ejecutar(dto: CrearHistoriaDto): Promise<HistoriaClinica> {
    const existeCita = await this.citaPort.obtenerPorId(dto.citaId);
    if (!existeCita) {
      throw new NotFoundException('La cita no existe');
    }

    const existeProfesional = await this.especialistaPort.obtenerPorId(
      dto.especialistaId,
    );
    if (!existeProfesional) {
      throw new BadRequestException('Especialista no válido');
    }

    const existePaciente = await this.pacientePort.obtenerPorId(dto.pacienteId);
    if (!existePaciente) {
      throw new BadRequestException('Paciente no válido');
    }

    const historia = new HistoriaClinica(
      randomUUID(),
      dto.citaId,
      dto.pacienteId,
      dto.especialistaId,
      new Date(),
      dto.descripcion,
    );

    await this.repository.guardar(historia);

    return historia;
  }
}
