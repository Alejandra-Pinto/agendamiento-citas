import { IsString, IsArray } from 'class-validator';

export class HorarioData {
  @IsArray()
  @IsString({ each: true })
  diaSemana: string[];

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;
}

export abstract class EspecialistaAgendaPort {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  abstract obtenerPorId(id: string): Promise<any | null>;
  abstract actualizarConfiguracion(
    id: string,
    intervalo: number,
    horario: HorarioData,
  ): Promise<void>;
  abstract obtenerTodasLasAgendas(): Promise<HorarioData[]>;
}
