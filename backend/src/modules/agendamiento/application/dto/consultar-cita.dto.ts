export enum TipoConsultaCita {
  PROXIMAS = 'PROXIMAS',
  CANCELADAS = 'CANCELADAS',
  PROGRAMADAS = 'PROGRAMADAS',
  REAGENDADAS = 'REAGENDADAS',
  FINALIZADAS = 'FINALIZADAS',
  NO_ASISTIO = 'NO_ASISTIO',
  TODAS = 'TODAS',
}

import { IsOptional, IsEnum } from 'class-validator';

export class ConsultarCitasDto {
  @IsOptional()
  id?: string; // <--- Añade esto

  @IsOptional()
  pacienteId?: string;

  @IsOptional()
  especialistaId?: string;

  @IsOptional()
  @IsEnum(TipoConsultaCita)
  tipo?: TipoConsultaCita;
}
