import { IsBoolean, IsDateString } from 'class-validator';

export class ConfigurarDiaDto {
  @IsDateString()
  fecha: string;

  @IsBoolean()
  habilitado: boolean;
}
