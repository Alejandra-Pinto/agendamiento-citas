import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
// Importación de Casos de Uso
import { ConfigurarAgendaUseCase } from '../../application/use-cases/configurar.agenda.usecase';
import { ConfigurarSistemaUseCase } from '../../application/use-cases/configurar.sistema.usecase';
import { ObtenerAgendaEspecialistaUseCase } from '../../application/use-cases/obtener.agenda.usecase';
import { ObtenerConfiguracionSistemaUseCase } from '../../application/use-cases/obtener.configuracion.sistema.usecase';
// Importación de DTOs
import { CrearConfiguracionDto } from '../../application/dto/crear-configuracion.dto';
import { ActualizarReglasGlobalesDto } from '../../application/dto/actualizar-reglas-globales.dto';
import { Roles } from 'nest-keycloak-connect';

@ApiTags('administrador')
@Controller('administrador')
export class AdministradorController {
  constructor(
    private readonly configurarAgendaUC: ConfigurarAgendaUseCase,
    private readonly actualizarGlobalUC: ConfigurarSistemaUseCase,
    private readonly obtenerAgendaUC: ObtenerAgendaEspecialistaUseCase,
    private readonly obtenerGlobalUC: ObtenerConfiguracionSistemaUseCase,
  ) {}

  // --- RUTAS PARA ESPECIALISTAS ---

  @Get('especialista/:id/agenda')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA', 'PACIENTE'] })
  @ApiOperation({ summary: 'Obtener agenda de un especialista' })
  @ApiParam({
    name: 'id',
    example: 'esp-123',
    description: 'ID del especialista',
  })
  @ApiResponse({ status: 200, description: 'Agenda del especialista' })
  async verAgendaMedico(@Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.obtenerAgendaUC.execute(id);
  }

  @Patch('especialista/:id/configurar-agenda')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Configurar agenda de un especialista' })
  @ApiParam({
    name: 'id',
    example: 'esp-123',
    description: 'ID del especialista',
  })
  @ApiBody({ type: CrearConfiguracionDto })
  @ApiResponse({ status: 200, description: 'Agenda actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async actualizarAgendaMedico(
    @Param('id') id: string,
    @Body() dto: CrearConfiguracionDto,
  ) {
    return await this.configurarAgendaUC.execute(
      id,
      dto.intervaloAtencion,
      dto.horarioAtencion,
    );
  }

  // --- RUTAS PARA EL SISTEMA (GLOBAL) ---

  @Get('configuracion-global')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA', 'PACIENTE'] })
  @ApiOperation({ summary: 'Obtener configuración global del sistema' })
  @ApiResponse({ status: 200, description: 'Configuración del sistema' })
  async verConfiguracionSistema() {
    return await this.obtenerGlobalUC.execute();
  }

  @Patch('configuracion-global')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Actualizar reglas globales del sistema' })
  @ApiBody({ type: ActualizarReglasGlobalesDto })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async actualizarSistema(@Body() dto: ActualizarReglasGlobalesDto) {
    return await this.actualizarGlobalUC.execute(
      dto.ventanaHabilitacionSemanas,
    );
  }
}
