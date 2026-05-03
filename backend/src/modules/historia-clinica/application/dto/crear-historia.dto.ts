/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearHistoriaDto {
  @ApiProperty({
    example: 'cita-123',
    description: 'ID de la cita asociada a la historia clínica',
  })
  @IsString()
  citaId: string;

  @ApiProperty({
    example: 'paciente-456',
    description: 'ID del paciente',
  })
  @IsString()
  pacienteId: string;

  @ApiProperty({
    example: 'especialista-789',
    description: 'ID del especialista que crea la historia clínica',
  })
  @IsString()
  especialistaId: string;

  @ApiProperty({
    example: 'Paciente presenta dolor de cabeza desde hace 3 días',
    description: 'Descripción detallada de la consulta',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
