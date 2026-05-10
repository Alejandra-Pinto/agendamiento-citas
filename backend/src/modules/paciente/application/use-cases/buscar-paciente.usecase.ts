import { Inject, Injectable } from '@nestjs/common';
import type { PacienteRepository } from '../../domain/repositories/paciente.repository';

@Injectable()
export class BuscarPacienteUseCase {
  constructor(
    @Inject('PacienteRepository')
    private readonly pacienteRepository: PacienteRepository,
  ) {}

  async ejecutar(documento: string) {
    return this.pacienteRepository.findById(documento);
  }

  async buscarPorTermino(termino: string) {
    if (!termino) return [];
    const resultados = await this.pacienteRepository.buscarPorTermino(termino);
    return resultados;
  }
}
