/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CrearCitaManualUseCase } from './crear-cita-manual.usecase';
import { BadRequestException } from '@nestjs/common';

describe('CrearCitaManualUseCase', () => {
  let useCase: CrearCitaManualUseCase;
  let mockRepo: any;
  let mockDispService: any;
  let mockEspecialistaPort: any;
  let mockPacientePort: any;

  beforeEach(() => {
    mockRepo = { buscarPorProfesionalYFecha: jest.fn(), guardar: jest.fn() };
    mockDispService = {
      estaEnVentanaPermitida: jest.fn().mockResolvedValue(true),
      existeConflicto: jest.fn().mockReturnValue(false),
    };
    mockPacientePort = { obtenerPorId: jest.fn() };
    mockEspecialistaPort = { obtenerPorId: jest.fn() };

    useCase = new CrearCitaManualUseCase(
      mockRepo,
      mockDispService,
      mockEspecialistaPort,
      mockPacientePort,
    );
  });

  it('debería lanzar BadRequest si el paciente está inactivo', async () => {
    mockPacientePort.obtenerPorId.mockResolvedValue({ activo: false });

    const dto = {
      pacienteId: 'p1',
      especialistaId: 'e1',
      fechaHora: new Date(Date.now() + 4000000).toISOString(),
      tipo: 'CONTROL',
    } as any;

    await expect(useCase.ejecutar(dto)).rejects.toThrow(BadRequestException);
  });

  it('debería lanzar error si el especialista no trabaja el día seleccionado', async () => {
    mockPacientePort.obtenerPorId.mockResolvedValue({ activo: true });
    mockEspecialistaPort.obtenerPorId.mockResolvedValue({
      activo: true,
      horarioAtencion: { diaSemana: ['Lunes'] }, // La cita será un Martes en el test
    });

    const fecha = new Date();

    // Buscar el próximo martes
    do {
      fecha.setDate(fecha.getDate() + 1);
    } while (fecha.getDay() !== 2);

    // Asegurar una hora válida
    fecha.setHours(10, 0, 0, 0);

    const dto = {
      pacienteId: 'p1',
      especialistaId: 'e1',
      fechaHora: fecha.toISOString(),
      tipo: 'CONTROL',
    } as any;

    await expect(useCase.ejecutar(dto)).rejects.toThrow(
      /La doctora no atiende los Martes/,
    );
  });
});
