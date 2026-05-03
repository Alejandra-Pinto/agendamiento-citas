import { Body, Controller, Get, Post, Param } from '@nestjs/common';
import { CrearPacienteUseCase } from '../../application/use-cases/crear-paciente.usecase';
import { ListarPacientesUseCase } from '../../application/use-cases/listar-pacientes.usecase';
import { BuscarPacienteUseCase } from './../../application/use-cases/buscar-paciente.usecase';
import { CrearPacienteDto } from '../../application/dto/crear-paciente.dto';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('pacientes')
@Controller('pacientes')
export class PacienteController {
  constructor(
    private readonly crearPaciente: CrearPacienteUseCase,
    private readonly listarPaciente: ListarPacientesUseCase,
    private readonly buscarPaciente: BuscarPacienteUseCase,
  ) {}

  @Post()
  @Unprotected() // Permite acceso sin token, ya que es para registro
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiBody({ type: CrearPacienteDto })
  @ApiResponse({ status: 201, description: 'Paciente creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crear(@Body() dto: CrearPacienteDto) {
    return this.crearPaciente.ejecutar(dto);
  }

  @Get()
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA'] })
  @ApiOperation({ summary: 'Listar todos los pacientes' })
  @ApiResponse({ status: 200, description: 'Listado de pacientes' })
  async listar() {
    return this.listarPaciente.ejecutar();
  }

  @Get(':documento')
  @Roles({ roles: ['ADMIN', 'ESPECIALISTA', 'PACIENTE'] })
  @ApiOperation({ summary: 'Buscar paciente por documento' })
  @ApiParam({
    name: 'documento',
    example: '123456789',
    description: 'Documento de identidad del paciente',
  })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async buscarPorDocumento(@Param('documento') documento: string) {
    return this.buscarPaciente.ejecutar(documento);
  }
}
