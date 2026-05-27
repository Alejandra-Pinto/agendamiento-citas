/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';

import type { PacienteRepository } from '../../domain/repositories/paciente.repository';
import { CrearPacienteDto } from '../dto/crear-paciente.dto';
import { Paciente } from '../../domain/entities/paciente.entity';
import { ValidacionPacienteService } from '../../domain/services/validacion-paciente.service';
import type { IdentidadRepository } from '../../domain/repositories/identidad.repository';

@Injectable()
export class CrearPacienteUseCase {
  private readonly logger = new Logger(
    CrearPacienteUseCase.name,
  );

  constructor(
    @Inject('PacienteRepository')
    private readonly pacienteRepository: PacienteRepository,

    private readonly validacion: ValidacionPacienteService,

    @Inject('IdentidadRepository')
    private readonly identidadRepository: IdentidadRepository,
  ) {}

  async ejecutar(dto: CrearPacienteDto) {

    this.logger.log(
      `Intentando crear paciente con documento ${dto.documento}`,
    );

    // Validaciones
    this.validacion.validarDocumento(dto.documento);

    this.validacion.validarCelular(dto.celular);

    this.logger.log(
      `Validaciones completadas para paciente ${dto.documento}`,
    );

    // Verificar existencia
    const existente =
      await this.pacienteRepository.findById(
        dto.documento,
      );

    if (existente) {

      this.logger.warn(
        `Intento de crear paciente duplicado con documento ${dto.documento}`,
      );

      throw new BadRequestException(
        'El paciente ya existe',
      );
    }

    // Crear usuario en Keycloak
    try {

      this.logger.log(
        `Creando usuario en Keycloak para paciente ${dto.documento}`,
      );

      await this.identidadRepository.crearUsuario(
        dto.documento,
        dto.password,
        dto.nombres,
        dto.apellidos,
        'PACIENTE',
        dto.email,
      );

      this.logger.log(
        `Usuario Keycloak creado correctamente para paciente ${dto.documento}`,
      );

    } catch (error: any) {

      this.logger.error(
        `Error al crear usuario Keycloak para paciente ${dto.documento}: ${error.message}`,
      );

      throw new BadRequestException(
        `Error en Keycloak: ${error.message || 'Error desconocido'}`,
      );
    }

    // Crear entidad paciente
    const paciente = new Paciente(
      dto.documento,
      dto.nombres,
      dto.apellidos,
      dto.celular,
      dto.generoP,
      dto.fechaNacimiento,
      dto.email,
    );

    // Guardar en SQL
    await this.pacienteRepository.save(paciente);

    this.logger.log(
      `Paciente ${dto.documento} creado correctamente en base de datos`,
    );

    return paciente;
  }
}
