import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  Param,
  Patch,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { type Response } from 'express'; // Importación necesaria para el tipado de res
import { CrearCitaManualUseCase } from '../../application/use-cases/crear-cita-manual.usecase';
import { ListarCitasProfesionalUseCase } from '../../application/use-cases/listar-citas-profesional.usecase';
import { CrearCitaDto } from '../../application/dto/crear-cita.dto';
import { ObtenerDisponibilidadUseCase } from '../../application/use-cases/obtener-disponibilidad.usecase';
import { ObtenerCitasUseCase } from '../../application/use-cases/obtener-citas.usecase';
import {
  ConsultarCitasDto,
  TipoConsultaCita,
} from '../../application/dto/consultar-cita.dto';
import { CancelarCitaUseCase } from '../../application/use-cases/cancelar-cita.usecase';
import { ReagendarCitaUseCase } from '../../application/use-cases/reagendar-cita.usecase';
import { FinalizarCitaUseCase } from '../../application/use-cases/finalizar-cita.usecase';
import { MarcarNoAsistioUseCase } from '../../application/use-cases/noAsistida-cita.usecase';
import { ExportarCitasUseCase } from '../../application/use-cases/exportar-citas.usecase';
import { ListarTodasLasCitasUseCase } from '../../application/use-cases/listar-citas-general-citas.usecase';
import { Roles } from 'nest-keycloak-connect';
import { DisponibilidadDto } from '../../application/dto/disponibilidad.dto';

@ApiTags('citas')
@Controller('citas')
export class CitaController {
  constructor(
    private readonly crearCita: CrearCitaManualUseCase,
    private readonly listarCitas: ListarCitasProfesionalUseCase,
    private readonly obtenerDisponibilidad: ObtenerDisponibilidadUseCase,
    private readonly obtenerCitas: ObtenerCitasUseCase,
    private readonly cancelarCita: CancelarCitaUseCase,
    private readonly reagendarCita: ReagendarCitaUseCase,
    private readonly finalizarCita: FinalizarCitaUseCase,
    private readonly marcarNoAsistioUseCase: MarcarNoAsistioUseCase,
    private readonly exportarCitasUseCase: ExportarCitasUseCase,
    private readonly listarTodasLasCitasUseCase: ListarTodasLasCitasUseCase, // Agregado correctamente
  ) {}

  @Post()
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA', 'PACIENTE'] })
  @ApiOperation({ summary: 'Crear una cita médica' })
  @ApiBody({ type: CrearCitaDto })
  @ApiResponse({ status: 201, description: 'Cita creada correctamente' })
  async crear(@Body() dto: CrearCitaDto) {
    try {
      return await this.crearCita.ejecutar(dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException('Error al crear la cita');
    }
  }

  @Get()
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Listar citas por especialista y fecha' })
  @ApiQuery({ name: 'especialistaId', example: 'esp-123' })
  @ApiQuery({ name: 'fecha', example: '2026-05-10' })
  async listar(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
  ) {
    try {
      return await this.listarCitas.ejecutar(especialistaId, fecha);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Error al listar citas');
    }
  }

  @Get('/disponibilidad')
  @ApiOperation({ summary: 'Obtener disponibilidad de un especialista' })
  @ApiQuery({ name: 'especialistaId', example: 'esp-123' })
  @ApiQuery({ name: 'fecha', example: '2026-05-10' })
  async disponibilidad(@Query() dto: DisponibilidadDto) {
    const horarios = await this.obtenerDisponibilidad.ejecutar(
      dto.especialistaId,
      dto.fecha,
    );

    return horarios.map((h) => ({
      hora: h.toLocaleTimeString(),
      iso: h.toISOString(),
    }));
  }

  @Get('paciente/:pacienteId')
  @ApiOperation({ summary: 'Listar citas de un paciente' })
  @ApiParam({ name: 'pacienteId', example: 'pac-123' })
  async listarPorPaciente(@Param('pacienteId') pacienteId: string) {
    const dto: ConsultarCitasDto = {
      pacienteId: pacienteId,
      tipo: TipoConsultaCita.TODAS,
    };

    // Esto es lo que garantiza que mapToDomain se ejecute y limpie los nombres
    return this.obtenerCitas.ejecutar(dto);
  }

  @Get('/filtrar')
  @ApiOperation({ summary: 'Filtrar citas con múltiples criterios' })
  async obtener(@Query() dto: ConsultarCitasDto) {
    return this.obtenerCitas.ejecutar(dto);
  }

  @Get('exportar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Exportar citas en PDF o Excel' })
  @ApiQuery({ name: 'especialistaId', example: 'esp-123' })
  @ApiQuery({ name: 'fecha', example: '2026-05-10' })
  @ApiQuery({ name: 'formato', enum: ['pdf', 'excel'] })
  async exportar(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
    @Query('formato') formato: 'pdf' | 'excel',
    @Res() res: Response, // Tipado correcto con Express
  ): Promise<void> {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw new BadRequestException('Formato de fecha inválido');
      }

      const safeFecha = fecha.replace(/[^0-9-]/g, '');

      const buffer = await this.exportarCitasUseCase.ejecutar(
        especialistaId,
        safeFecha,
        formato,
      );

      const ext = formato === 'excel' ? 'xlsx' : 'pdf';
      const contentType =
        formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=citas_${safeFecha}.${ext}`,
      });

      res.end(buffer);
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw new BadRequestException('Error al exportar las citas');
    }
  }

  @Patch(':id/cancelar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiParam({ name: 'id', example: 'cita-123' })
  async cancelar(@Param('id') id: string) {
    try {
      return await this.cancelarCita.ejecutar(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException('Error al cancelar la cita');
    }
  }

  @Patch(':id/reagendar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Reagendar una cita' })
  @ApiParam({ name: 'id', example: 'cita-123' })
  @ApiBody({
    schema: {
      example: { fechaHora: '2026-05-10T10:00:00.000Z' },
    },
  })
  async reagendar(
    @Param('id') id: string,
    @Body('fechaHora') fechaHora: string,
  ) {
    try {
      // Validación básica
      if (!fechaHora || isNaN(new Date(fechaHora).getTime())) {
        throw new BadRequestException('Fecha inválida');
      }

      return await this.reagendarCita.ejecutar(id, new Date(fechaHora));
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error; // errores controlados
      }

      // error interno oculto
      throw new BadRequestException('Error al reagendar la cita');
    }
  }

  @Patch(':id/finalizar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Finalizar una cita' })
  @ApiParam({ name: 'id', example: 'cita-123' })
  async finalizar(@Param('id') id: string) {
    try {
      return await this.finalizarCita.ejecutar(id);
    } catch (error) {
      // Si ya es una excepción de Nest → la dejamos pasar
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      // Si es error interno → lo ocultamos
      throw new BadRequestException('Error al finalizar la cita');
    }
  }

  @Patch(':id/no-asistio')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Marcar cita como no asistida' })
  @ApiParam({ name: 'id', example: 'cita-123' })
  async marcarNoAsistio(@Param('id') id: string) {
    try {
      return await this.marcarNoAsistioUseCase.ejecutar(id);
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      throw new BadRequestException('Error al actualizar la cita');
    }
  }

  @Get('resumen-disponibilidad')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Resumen general de citas y disponibilidad' })
  async obtenerResumen() {
    return await this.listarTodasLasCitasUseCase.ejecutar();
  }

  @Get(':id')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async obtenerPorId(@Param('id') id: string) {
    return this.obtenerCitas.ejecutar({
      id: id,
      tipo: TipoConsultaCita.TODAS,
    });
  }
}
