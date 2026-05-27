/* eslint-disable prettier/prettier */
import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import type { EspecialistaRepository } from '../../domain/repositories/especialista.repository';
import { CrearEspecialistaDto } from '../dto/crear-especialista.dto';
import { Especialista } from '../../domain/entities/especialista.entity';
import { PoliticaEspecialistaService } from '../../domain/services/politica-especialista.service';
import { ValidacionEspecialistaService } from '../../domain/services/validacion-especialista.service';

@Injectable()
export class CrearEspecialistaUseCase {
  private readonly logger = new Logger(
    CrearEspecialistaUseCase.name,
  );

  constructor(
    @Inject('EspecialistaRepository')
    private readonly especialistaRepository: EspecialistaRepository,

    private readonly politica: PoliticaEspecialistaService,

    private readonly validacion: ValidacionEspecialistaService,
  ) {}

  async ejecutar(dto: CrearEspecialistaDto) {

    this.logger.log(
      `Intentando crear especialista con ID ${dto.id}`,
    );

    // Validaciones
    this.validacion.validarDocumento(dto.id);

    this.validacion.validarEspecialidad(
      dto.especialidad,
    );

    this.logger.log(
      `Validaciones completadas para especialista ${dto.id}`,
    );

    // Política de intervalo
    this.politica.validarIntervalo(
      dto.intervaloAtencion,
    );

    this.logger.log(
      `Intervalo de atención validado: ${dto.intervaloAtencion} minutos`,
    );

    // Verificar existencia
    const existente =
      await this.especialistaRepository.findById(dto.id);

    if (existente) {

      this.logger.warn(
        `Intento de crear especialista duplicado con ID ${dto.id}`,
      );

      throw new BadRequestException(
        'El especialista ya existe',
      );
    }

    // Crear entidad
    const especialista = new Especialista(
      dto.id,
      dto.nombres,
      dto.tipo,
      dto.especialidad,
      dto.intervaloAtencion,
      dto.horarioAtencion,
      true,
    );

    // Guardar
    await this.especialistaRepository.save(
      especialista,
    );

    this.logger.log(
      `Especialista ${dto.id} creado correctamente`,
    );

    return especialista;
  }
}
