/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GeneroEnum } from '../../domain/entities/paciente.entity';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearPacienteDto {
  @ApiProperty({
    example: '123456789',
    description: 'Documento de identidad del paciente',
  })
  @IsString()
  @Matches(/^[0-9]+$/, {
    message: 'El id solo debe contener números',
  })
  documento: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombres del paciente',
  })
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  nombres: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellidos del paciente',
  })
  @IsString()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  apellidos: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Número de celular',
  })
  @IsString()
  @Matches(/^[0-9]+$/, {
    message: 'El celular solo debe contener números',
  })
  celular: string;

  @ApiProperty({
    enum: GeneroEnum,
    example: GeneroEnum.MASCULINO,
    description: 'Género del paciente',
  })
  @IsEnum(GeneroEnum)
  generoP: GeneroEnum;

  @ApiPropertyOptional({
    example: '2000-05-15',
    description: 'Fecha de nacimiento',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fechaNacimiento?: Date;

  @ApiPropertyOptional({
    example: 'correo@email.com',
    description: 'Correo electrónico',
  })
  @Transform(({ value }) => (value === '' ? undefined : value)) // <--- Línea mágica
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del paciente (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @Exclude({ toPlainOnly: true })
  password: string;
}
