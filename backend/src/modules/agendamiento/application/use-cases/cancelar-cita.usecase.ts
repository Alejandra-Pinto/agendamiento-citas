import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity';

@Injectable()
export class CancelarCitaUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(id: string) {
    // 1. Buscamos los datos en la base de datos
    const data = await this.citaRepository.buscarPorId(id);

    if (!data) {
      throw new NotFoundException('Cita no encontrada');
    }

    // 2. RECONSTRUIR LA INSTANCIA
    // Esto es vital porque los datos que vienen del Repo son un JSON plano
    // Al hacer 'new Cita', recuperas los métodos cancelar(), finalizar(), etc.
    const cita = new Cita(
      data.id,
      data.pacienteId,
      data.especialistaId,
      data.fechaHora,
      data.duracion,
      data.tipo,
      data.estado, // Pasamos el estado actual para que las validaciones funcionen
    );

    try {
      cita.cancelar();
      await this.citaRepository.guardar(cita);
      return cita;
    } catch (error) {
      // Verificamos si el error es una instancia de Error
      const mensaje =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(mensaje);
    }
  }
}
