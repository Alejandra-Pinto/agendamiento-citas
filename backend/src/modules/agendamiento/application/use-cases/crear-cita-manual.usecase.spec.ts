/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CrearCitaManualUseCase } from './crear-cita-manual.usecase';
import { BadRequestException } from '@nestjs/common';
import { Cita, EstadoCita, TipoCita } from '../../domain/entities/cita.entity';

describe('CrearCitaManualUseCase', () => {
  let useCase: CrearCitaManualUseCase;
  let mockRepo: any;
  let mockDispService: any;
  let mockEspecialistaPort: any;
  let mockPacientePort: any;

  beforeEach(() => {
    mockRepo = { 
      buscarPorProfesionalYFecha: jest.fn(), 
      guardar: jest.fn(),
      buscarPorPaciente: jest.fn().mockResolvedValue([]), // <-- Comportamiento por defecto para que no falle ningún test previo
    };
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

  it('debería lanzar un error si el paciente ya tiene una cita activa asignada para el mismo día', async () => {
    // Definimos datos válidos para bypass de las primeras validaciones
    mockPacientePort.obtenerPorId.mockResolvedValue({ activo: true });
    
    // Configuramos una fecha futura simulada
    const fechaCitaExistente = new Date('2026-06-15T10:00:00.000Z');
    const fechaNuevaCita = new Date('2026-06-15T15:00:00.000Z'); // Mismo día, diferente hora

    // Creamos la instancia de la cita que el paciente ya tiene reservada ese día
    const citaExistente = new Cita(
      'cita-existente-id',
      'p1',
      'e1', // Supongamos que es con la Doctora 1
      fechaCitaExistente,
      20,
      TipoCita.CONTROL,
      EstadoCita.PROGRAMADA
    );

    // Hacemos que el repositorio devuelva la cita que colisiona en fecha
    mockRepo.buscarPorPaciente.mockResolvedValue([citaExistente]);

    const dto = {
      pacienteId: 'p1',
      especialistaId: 'e2', // Intenta con la Doctora 2 (Especialista diferente)
      fechaHora: fechaNuevaCita.toISOString(),
      tipo: 'CONTROL',
    } as any;

    await expect(useCase.ejecutar(dto)).rejects.toThrow(
      'El paciente ya cuenta con una cita agendada para este mismo día.',
    );
  });
});