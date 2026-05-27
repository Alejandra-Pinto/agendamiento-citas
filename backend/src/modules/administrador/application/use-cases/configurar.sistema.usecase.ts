/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfiguracionRepository } from '../../domain/repositories/configuracion.repository';
import { ConfiguracionSistema } from '../../domain/entities/configuracion-sistema.entity';

@Injectable()
export class ConfigurarSistemaUseCase {
  private readonly logger = new Logger(
    ConfigurarSistemaUseCase.name,
  );

  constructor(
    private readonly adminRepository: ConfiguracionRepository,
  ) {}

  async execute(ventanaSemanas: number) {

    this.logger.log(
      `Actualizando configuración global del sistema a ${ventanaSemanas} semanas`,
    );

    let config =
      await this.adminRepository.obtenerConfiguracionGlobal();

    // Crear configuración inicial
    if (!config) {

      this.logger.log(
        'No existe configuración global previa. Creando configuración inicial',
      );

      config = new ConfiguracionSistema(
        'GLOBAL_001',
        ventanaSemanas,
        new Date(),
      );

    } else {

      this.logger.log(
        `Configuración global encontrada. Ventana anterior: ${config.ventanaHabilitacionSemanas}`,
      );

      config.actualizarVentana(ventanaSemanas);
    }

    await this.adminRepository.save(config);

    this.logger.log(
      `Configuración global actualizada correctamente a ${ventanaSemanas} semanas`,
    );
  }
}
