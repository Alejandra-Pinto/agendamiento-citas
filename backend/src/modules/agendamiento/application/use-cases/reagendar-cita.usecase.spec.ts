/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ReagendarCitaUseCase } from './reagendar-cita.usecase';
import { Cita, TipoCita } from '../../domain/entities/cita.entity';

describe('ReagendarCitaUseCase', () => {
  let useCase: ReagendarCitaUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      buscarPorId: jest.fn(),
      buscarPorProfesionalYFecha: jest.fn(),
      guardar: jest.fn(),
    };
    useCase = new ReagendarCitaUseCase(mockRepo);
  });

  it('debería lanzar error si hay solapamiento con otra cita', async () => {
    const citaExistente = new Cita(
      '1',
      'p1',
      'e1',
      new Date(),
      20,
      TipoCita.CONTROL,
    );

    // Fecha futura base
    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + 7);
    fechaBase.setHours(10, 0, 0, 0);

    const otraCita = new Cita(
      '2',
      'p2',
      'e1',
      fechaBase,
      20,
      TipoCita.CONTROL,
    );

    // Choca con la cita anterior (10:00 - 10:20)
    const nuevaFecha = new Date(fechaBase);
    nuevaFecha.setMinutes(10);

    mockRepo.buscarPorId.mockResolvedValue(citaExistente);
    mockRepo.buscarPorProfesionalYFecha.mockResolvedValue([otraCita]);

    await expect(useCase.ejecutar('1', nuevaFecha)).rejects.toThrow(
      'Horario no disponible',
    );
  });
});
