/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  Matches,
  Length,
} from 'class-validator';
import {
  TipoProfesional,
  Especialidad,
} from '../../domain/entities/especialista.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class HorarioAtencionDto {
  @ApiProperty({
    example: ['Lunes', 'Martes'],
    description: 'Días de la semana en los que atiende',
  })
  @IsArray()
  @IsString({ each: true })
  diaSemana: string[];

  @ApiProperty({
    example: '08:00',
    description: 'Hora de inicio de atención',
  })
  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({
    example: '17:00',
    description: 'Hora de finalización de atención',
  })
  @IsString()
  @IsNotEmpty()
  horaFin: string;
}

export class CrearEspecialistaDto {
  @ApiProperty({
    example: 'esp-123',
    description: 'ID único del especialista',
  })
  @IsString()
  @Matches(/^[0-9]+$/, {
    message: 'El id solo debe contener números',
  })
  id: string;

  @ApiProperty({
    example: 'Dr. Carlos Gómez',
    description: 'Nombre completo del especialista',
  })
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  nombres: string;

  @ApiProperty({
    enum: TipoProfesional,
    example: TipoProfesional.MEDICO,
    description: 'Tipo de profesional',
  })
  @IsEnum(TipoProfesional)
  tipo: TipoProfesional;

  @ApiProperty({
    enum: Especialidad,
    example: Especialidad.FISIOTERAPIA,
    description: 'Especialidad médica',
  })
  @IsEnum(Especialidad)
  especialidad: Especialidad;

  @ApiProperty({
    example: 30,
    description: 'Intervalo de atención en minutos',
  })

  @IsInt()
  @Min(1)
  intervaloAtencion: number;

  @ApiProperty({
    type: HorarioAtencionDto,
    description: 'Horario de atención del especialista',
  })
  @ValidateNested() // Valida el objeto interno
  @Type(() => HorarioAtencionDto) // Le dice a class-transformer qué clase usar
  horarioAtencion: HorarioAtencionDto;
}
