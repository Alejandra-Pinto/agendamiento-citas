import { Body, Controller, Get, Post } from '@nestjs/common';
import { CrearEspecialistaUseCase } from '../../application/use-cases/crear-especialista.usecase';
import { ListarEspecialistasUseCase } from '../../application/use-cases/listar-especialista.usecase';
import { CrearEspecialistaDto } from '../../application/dto/crear-especialista.dto';
import { Roles } from 'nest-keycloak-connect';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('especialistas')
@Controller('especialistas')
export class EspecialistaController {
  constructor(
    private readonly crearEspecialista: CrearEspecialistaUseCase,
    private readonly listarEspecialistas: ListarEspecialistasUseCase,
  ) {}

  @Post()
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'Registrar un nuevo especialista' })
  @ApiBody({ type: CrearEspecialistaDto })
  @ApiResponse({
    status: 201,
    description: 'Especialista creado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crear(@Body() dto: CrearEspecialistaDto) {
    return this.crearEspecialista.ejecutar(dto);
  }

  @Get()
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA', 'PACIENTE'] })
  @ApiOperation({ summary: 'Listar todos los especialistas' })
  @ApiResponse({ status: 200, description: 'Listado de especialistas' })
  async listar() {
    return this.listarEspecialistas.ejecutar();
  }
}
