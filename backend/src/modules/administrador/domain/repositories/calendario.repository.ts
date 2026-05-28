import { CalendarioClinica } from '../entities/calendario-clinica.entity';

export abstract class CalendarioRepository {
  abstract guardar(dia: CalendarioClinica): Promise<void>;

  abstract buscarPorFecha(fecha: Date): Promise<CalendarioClinica | null>;

  abstract listarPorMes(
    anio: number,
    mes: number,
  ): Promise<CalendarioClinica[]>;
}
