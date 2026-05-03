import { Inject, Injectable } from '@nestjs/common';
import { Cita, EstadoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { ConsultarCitasDto, TipoConsultaCita } from '../dto/consultar-cita.dto';

@Injectable()
export class ObtenerCitasUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(dto: ConsultarCitasDto): Promise<Cita[]> {
    // 1. Traemos las citas filtradas desde la DB (ya sea por doctor o por paciente)
    const citas = await this.citaRepository.buscarTodas(dto);
    // 2. Si venimos buscando un ID específico, devolvemos la primera coincidencia
    if (dto.id && citas.length > 0) {
      return [citas[0]]; // Retornamos la cita individual
    }

    const ahora = new Date();
    // 2. Aplicamos el filtro de estado que ya tenías
    // Esto funcionará igual de bien para el doctor o para el paciente
    switch (dto.tipo) {
      case TipoConsultaCita.PROXIMAS:
        return citas.filter(
          (c) => c.fechaHora > ahora && c.estado === EstadoCita.PROGRAMADA,
        );

      case TipoConsultaCita.CANCELADAS:
        return citas.filter((c) => c.estado === EstadoCita.CANCELADA);

      case TipoConsultaCita.PROGRAMADAS:
        return citas.filter((c) => c.estado === EstadoCita.PROGRAMADA);

      case TipoConsultaCita.REAGENDADAS:
        return citas.filter((c) => c.estado === EstadoCita.REAGENDADA);

      case TipoConsultaCita.FINALIZADAS:
        return citas.filter((c) => c.estado === EstadoCita.FINALIZADA);

      case TipoConsultaCita.NO_ASISTIO:
        return citas.filter((c) => c.estado === EstadoCita.NO_ASISTIO);

      case TipoConsultaCita.TODAS:
      default:
        return citas;
    }
  }
}
