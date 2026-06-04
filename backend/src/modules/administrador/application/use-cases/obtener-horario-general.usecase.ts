import { Injectable } from '@nestjs/common';
import { EspecialistaAgendaPort } from '../../domain/ports/especialista-agenda.port';
import { HorarioGeneralService } from '../../domain/services/horario-general.service';
import { HorarioGeneralDto } from '../dto/horario-general.dto';

@Injectable()
export class ObtenerHorarioGeneralUseCase {
  constructor(
    private readonly especialistaAgendaPort: EspecialistaAgendaPort,
    private readonly horarioGeneralService: HorarioGeneralService,
  ) {}

  async execute(): Promise<HorarioGeneralDto[]> {
    const agendas = await this.especialistaAgendaPort.obtenerTodasLasAgendas();

    return this.horarioGeneralService.calcular(agendas);
  }
}
