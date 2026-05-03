import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity'; // Importa la entidad

@Injectable()
export class ListarCitasProfesionalUseCase {
  constructor(
    @Inject('CitaRepository')
    private readonly citaRepository: CitaRepository,
  ) {}

  async ejecutar(especialistaId: string, fecha?: string): Promise<Cita[]> {
    // 1. Validar que el especialistaId no esté vacío
    if (!especialistaId || especialistaId.trim() === '') {
      throw new BadRequestException('El ID del especialista es requerido');
    }

    // 2. Si no se proporciona fecha, usar la fecha actual
    const fechaConsulta = fecha || this.obtenerFechaActual();

    // 3. Validar formato de fecha si se proporcionó
    if (fecha && !this.esFechaValida(fecha)) {
      throw new BadRequestException(
        'Formato de fecha inválido. Use YYYY-MM-DD',
      );
    }

    // 4. Obtener las citas
    const citas = await this.citaRepository.buscarPorProfesionalYFecha(
      especialistaId,
      fechaConsulta,
    );

    // 5. Ordenar citas por hora
    return this.ordenarCitasPorHora(citas);
  }

  private obtenerFechaActual(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private esFechaValida(fecha: string): boolean {
    // Validar formato YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(fecha)) return false;

    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private ordenarCitasPorHora(citas: Cita[]): Cita[] {
    return [...citas].sort((a, b) => {
      const horaA = new Date(a.fechaHora).getTime();
      const horaB = new Date(b.fechaHora).getTime();
      return horaA - horaB;
    });
  }
}
