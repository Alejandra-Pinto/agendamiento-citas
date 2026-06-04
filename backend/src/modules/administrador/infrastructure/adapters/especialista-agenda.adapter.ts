/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import {
  EspecialistaAgendaPort,
  HorarioData,
} from '../../domain/ports/especialista-agenda.port';
import { ConfigurarAgendaEspecialistaUseCase } from '../../../especialista/application/use-cases/configurar-agenda-especialista.usecase';
import { EspecialistaRepositoryImpl } from '../../../especialista/infrastructure/persistence/especialista.repository.impl';

@Injectable()
export class EspecialistaAgendaAdapter implements EspecialistaAgendaPort {
  constructor(
    private readonly configurarUseCase: ConfigurarAgendaEspecialistaUseCase,
    @Inject('EspecialistaRepository')
    private readonly especialistaRepo: EspecialistaRepositoryImpl,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async obtenerPorId(id: string): Promise<any | null> {
    const especialista = await this.especialistaRepo.findById(id);
    if (!especialista) return null;

    // Retornamos solo lo que le interesa al administrador (la agenda)
    return {
      id: especialista.id,
      nombres: especialista.nombres,
      intervaloAtencion: especialista.intervaloAtencion,
      horarioAtencion: especialista.horarioAtencion,
      activo: especialista.activo,
    };
  }

  async actualizarConfiguracion(
    id: string,
    intervalo: number,
    horario: HorarioData,
  ): Promise<void> {
    await this.configurarUseCase.execute(id, intervalo, horario);
  }

  async obtenerTodasLasAgendas(): Promise<HorarioData[]> {
    const especialistas = await this.especialistaRepo.findAll();

    return especialistas.map((e) => e.horarioAtencion).filter((h) => h != null);
  }
}
