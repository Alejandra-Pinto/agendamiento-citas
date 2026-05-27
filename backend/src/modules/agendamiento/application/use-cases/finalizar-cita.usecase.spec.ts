/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { FinalizarCitaUseCase } from './finalizar-cita.usecase';
import { Cita, EstadoCita, TipoCita } from '../../domain/entities/cita.entity';

describe('FinalizarCitaUseCase', () => {
  let useCase: FinalizarCitaUseCase;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = { buscarPorId: jest.fn(), guardar: jest.fn() };
    useCase = new FinalizarCitaUseCase(mockRepo);
  });

  it('debería lanzar error si la cita aún no ha terminado (tiempo futuro)', async () => {
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 1);

    const cita = new Cita('1', 'p1', 'e1', fechaFutura, 20, TipoCita.CONTROL);

    mockRepo.buscarPorId.mockResolvedValue(cita);

    await expect(useCase.ejecutar('1')).rejects.toThrow(
      'No puedes finalizar una cita de un día futuro', // <-- Debe ser idéntico al del archivo .ts
    );
  });

  it('debería finalizar la cita si ya pasó el tiempo', async () => {
    const fechaPasada = new Date('2020-01-01T10:00:00');
    const cita = new Cita('1', 'p1', 'e1', fechaPasada, 20, TipoCita.CONTROL);
    mockRepo.buscarPorId.mockResolvedValue(cita);

    const resultado = await useCase.ejecutar('1');
    expect(resultado.estado).toBe(EstadoCita.FINALIZADA);
  });
});
