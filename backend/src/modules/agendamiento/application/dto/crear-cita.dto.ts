/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsDate, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoCita } from '../../domain/entities/cita.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CrearCitaDto {
  @ApiProperty({ example: 'pac-123' })
  @IsString()
  pacienteId: string;

  @ApiProperty({ example: 'esp-456' })
  @IsString()
  especialistaId: string;

  @ApiProperty({
    example: '2026-05-10T10:00:00.000Z',
    description: 'Fecha y hora de la cita',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha proporcionada no es válida' })
  // Quitamos @Matches porque choca con @IsDate
  fechaHora: Date;

  @ApiProperty({
    enum: TipoCita,
    example: TipoCita.PRIMERA_VEZ,
  })
  @IsEnum(TipoCita)
  tipo: TipoCita;
}
