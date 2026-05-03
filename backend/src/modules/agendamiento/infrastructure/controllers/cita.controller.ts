import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  Param,
  Patch,
} from '@nestjs/common';
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
  async crear(@Body() dto: CrearCitaDto) {
    return this.crearCita.ejecutar(dto);
  }

  @Get()
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async listar(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
  ) {
    return this.listarCitas.ejecutar(especialistaId, fecha);
  }

  @Get('/disponibilidad')
  async disponibilidad(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
  ) {
    const horarios = await this.obtenerDisponibilidad.ejecutar(
      especialistaId,
      fecha,
    );

    return horarios.map((h) => ({
      hora: h.toLocaleTimeString(),
      iso: h.toISOString(),
    }));
  }

  @Get('paciente/:pacienteId')
  async listarPorPaciente(@Param('pacienteId') pacienteId: string) {
    const dto: ConsultarCitasDto = {
      pacienteId: pacienteId,
      tipo: TipoConsultaCita.TODAS,
    };

    // Esto es lo que garantiza que mapToDomain se ejecute y limpie los nombres
    return this.obtenerCitas.ejecutar(dto);
  }

  @Get('/filtrar')
  async obtener(@Query() dto: ConsultarCitasDto) {
    return this.obtenerCitas.ejecutar(dto);
  }

  @Get('exportar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async exportar(
    @Query('especialistaId') especialistaId: string,
    @Query('fecha') fecha: string,
    @Query('formato') formato: 'pdf' | 'excel',
    @Res() res: Response, // Tipado correcto con Express
  ): Promise<void> {
    const buffer = await this.exportarCitasUseCase.ejecutar(
      especialistaId,
      fecha,
      formato,
    );

    const ext = formato === 'excel' ? 'xlsx' : 'pdf';
    const contentType =
      formato === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename=citas_piedra_azul_${fecha}.${ext}`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }

  @Patch(':id/cancelar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async cancelar(@Param('id') id: string) {
    return this.cancelarCita.ejecutar(id);
  }

  @Patch(':id/reagendar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async reagendar(
    @Param('id') id: string,
    @Body('fechaHora') fechaHora: string,
  ) {
    return this.reagendarCita.ejecutar(id, new Date(fechaHora));
  }

  @Patch(':citaId/finalizar')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async finalizar(@Param('citaId') citaId: string) {
    return this.finalizarCita.ejecutar(citaId);
  }

  @Patch(':id/no-asistio')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  async marcarNoAsistio(@Param('id') id: string) {
    return this.marcarNoAsistioUseCase.ejecutar(id);
  }

  @Get('resumen-disponibilidad')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
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
