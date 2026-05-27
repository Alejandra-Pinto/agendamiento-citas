/* eslint-disable prettier/prettier */
// administrador/application/use-cases/obtener-configuracion-sistema.usecase.ts

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfiguracionRepository } from '../../domain/repositories/configuracion.repository';

@Injectable()
export class ObtenerConfiguracionSistemaUseCase {
  private readonly logger = new Logger(
    ObtenerConfiguracionSistemaUseCase.name,
  );

  constructor(
    private readonly adminRepository: ConfiguracionRepository,
  ) {}

  async execute() {

    this.logger.log(
      'Consultando configuración global del sistema',
    );

    const config =
      await this.adminRepository.obtenerConfiguracionGlobal();

    // Si no existe configuración
    if (!config) {

      this.logger.warn(
        'No existe configuración global. Retornando valores por defecto',
      );

      return {
        ventanaHabilitacionSemanas: 4,
        mensaje: 'Valores por defecto',
      };
    }

    this.logger.log(
      'Configuración global obtenida correctamente',
    );

    return config;
  }
}
