/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CancelarCitaUseCase } from './cancelar-cita.usecase';
import { Cita, EstadoCita, TipoCita } from '../../domain/entities/cita.entity';

describe('CancelarCitaUseCase', () => {
  let useCase: CancelarCitaUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      buscarPorId: jest.fn(),
      guardar: jest.fn(),
    };
    useCase = new CancelarCitaUseCase(mockRepo);
  });

  it('debería cancelar una cita exitosamente', async () => {
    const citaFake = new Cita(
      '1',
      'p1',
      'e1',
      new Date(),
      20,
      TipoCita.CONTROL,
    );
    // Forzamos a que inicie como PROGRAMADA para el test
    citaFake.estado = EstadoCita.PROGRAMADA;

    mockRepo.buscarPorId.mockResolvedValue(citaFake);

    const resultado = await useCase.ejecutar('1');

    expect(resultado.estado).toBe(EstadoCita.CANCELADA);

    // CAMBIO AQUÍ: Usamos expect.objectContaining para validar el estado final
    expect(mockRepo.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        estado: EstadoCita.CANCELADA,
      }),
    );
  });

  it('debería lanzar error si la cita no existe', async () => {
    mockRepo.buscarPorId.mockResolvedValue(null);
    await expect(useCase.ejecutar('999')).rejects.toThrow('Cita no encontrada');
  });
});
