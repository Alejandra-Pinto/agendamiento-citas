import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CrearHistoriaUseCase } from '../../application/use-cases/crear-historia.usecase';
import { ListarHistoriasPacienteUseCase } from '../../application/use-cases/listar-historias-paciente.usecase';
import { ObtenerHistoriaPorCitaUseCase } from '../../application/use-cases/obtener-historia-por-cita.usecase';
import { ListarHistoriasUseCase } from '../../application/use-cases/listar-historias.usecase';
import { ListarHistoriasEspecialistaUseCase } from '../../application/use-cases/listar-historias-especialista.usecase';

import { CrearHistoriaDto } from '../../application/dto/crear-historia.dto';
import { Roles } from 'nest-keycloak-connect';

@ApiTags('historia-clinica')
@Controller('historias-clinicas')
export class HistoriaClinicaController {
  constructor(
    private readonly crearHistoriaUseCase: CrearHistoriaUseCase,
    private readonly listarHistoriasPacienteUseCase: ListarHistoriasPacienteUseCase,
    private readonly obtenerHistoriaPorCitaUseCase: ObtenerHistoriaPorCitaUseCase,
    private readonly listarHistoriasEspecialistaUseCase: ListarHistoriasEspecialistaUseCase,
    private readonly listarHistoriasUseCase: ListarHistoriasUseCase,
  ) {}

  @Post()
  @Roles({ roles: ['ESPECIALISTA'] })
  @ApiOperation({ summary: 'Crear una historia clínica' })
  @ApiBody({ type: CrearHistoriaDto })
  @ApiResponse({
    status: 201,
    description: 'Historia clínica creada correctamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crear(@Body() dto: CrearHistoriaDto) {
    try {
      return await this.crearHistoriaUseCase.ejecutar(dto);
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw new HttpException(
        'Error al crear la historia clínica',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Roles({ roles: ['ESPECIALISTA'] })
  @Get('cita/:citaId')
  @ApiOperation({ summary: 'Obtener historia clínica por ID de cita' })
  @ApiParam({ name: 'citaId', example: '12345', description: 'ID de la cita' })
  @ApiResponse({ status: 200, description: 'Historia clínica encontrada' })
  @ApiResponse({ status: 404, description: 'Historia clínica no encontrada' })
  async obtenerPorCita(@Param('citaId') citaId: string) {
    try {
      const historia =
        await this.obtenerHistoriaPorCitaUseCase.ejecutar(citaId);

      if (!historia) {
        throw new HttpException(
          'Historia clínica no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }

      return historia;
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw new HttpException(
        'Error al obtener la historia clínica',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Roles({ roles: ['ESPECIALISTA', 'PACIENTE'] })
  @Get('paciente/:pacienteId')
  @ApiOperation({ summary: 'Listar historias clínicas de un paciente' })
  @ApiParam({
    name: 'pacienteId',
    example: '987654321',
    description: 'ID del paciente',
  })
  @ApiResponse({ status: 200, description: 'Listado de historias clínicas' })
  async listarPorPaciente(@Param('pacienteId') pacienteId: string) {
    try {
      return await this.listarHistoriasPacienteUseCase.ejecutar(pacienteId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Error al listar historias clínicas',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Roles({ roles: ['ESPECIALISTA'] })
  @Get()
  @ApiOperation({ summary: 'Listar todas las historias clínicas' })
  @ApiResponse({
    status: 200,
    description: 'Listado completo de historias clínicas',
  })
  async listarTodas() {
    try {
      return await this.listarHistoriasUseCase.ejecutar();
    } catch {
      throw new HttpException(
        'Error al listar historias',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('mis-historias')
  @Roles({ roles: ['ESPECIALISTA'] })
  @ApiOperation({
    summary: 'Listar historias clínicas del especialista autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Historias clínicas del especialista',
  })
  async listarMisHistorias(@Req() req: any) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const profesionalId = req.user?.sub;

      if (!profesionalId) {
        throw new HttpException(
          'Usuario no autenticado',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.listarHistoriasEspecialistaUseCase.ejecutar(
        profesionalId,
      );
    } catch {
      throw new HttpException(
        'Error al listar historias del especialista',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
