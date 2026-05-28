/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import { ConfigurarDiaClinicaUseCase } from '../../application/use-cases/configurar-dia-clinica.usecase';
import { ObtenerCalendarioUseCase } from '../../application/use-cases/obtener-calendario.usecase';
import { ConfigurarDiaDto } from '../../application/dto/configurar-dia.dto';

@Controller('admin/calendario')
export class CalendarioController {
  constructor(
    private readonly configurarDia:
      ConfigurarDiaClinicaUseCase,

    private readonly obtenerCalendario:
      ObtenerCalendarioUseCase,
  ) {}

  @Post()
  async configurarDiaClinica(
    @Body() dto: ConfigurarDiaDto,
  ) {
    await this.configurarDia.ejecutar(dto);

    return {
      mensaje: 'Día configurado correctamente',
    };
  }

  @Get()
  async obtener(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    return this.obtenerCalendario.ejecutar(
      Number(anio),
      Number(mes),
    );
  }
}
