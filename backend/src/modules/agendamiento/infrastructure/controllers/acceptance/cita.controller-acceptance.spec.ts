/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CitaController } from '../cita.controller';
import { TipoCita } from '../../../domain/entities/cita.entity';
import { CrearCitaManualUseCase } from '../../../application/use-cases/crear-cita-manual.usecase';
import { DisponibilidadAgendamientoService } from '../../../domain/services/disponibilidad-agendamiento.service';

// Dependencias de soporte obligatorias para que el controlador compile correctamente en NestJS
import { ListarCitasProfesionalUseCase } from '../../../application/use-cases/listar-citas-profesional.usecase';
import { ObtenerDisponibilidadUseCase } from '../../../application/use-cases/obtener-disponibilidad.usecase';
import { ObtenerCitasUseCase } from '../../../application/use-cases/obtener-citas.usecase';
import { CancelarCitaUseCase } from '../../../application/use-cases/cancelar-cita.usecase';
import { ReagendarCitaUseCase } from '../../../application/use-cases/reagendar-cita.usecase';
import { FinalizarCitaUseCase } from '../../../application/use-cases/finalizar-cita.usecase';
import { MarcarNoAsistioUseCase } from '../../../application/use-cases/noAsistida-cita.usecase';
import { ExportarCitasUseCase } from '../../../application/use-cases/exportar-citas.usecase';
import { ListarTodasLasCitasUseCase } from '../../../application/use-cases/listar-citas-general-citas.usecase';

describe('CitaController (Pruebas de Aceptación - Criterios de Historia de Usuario)', () => {
  let app: INestApplication;

  // Mocks de los puertos de salida (Base de datos / APIs externas)
  const mockCitaRepository = {
    buscarPorPaciente: jest.fn(),
    buscarPorProfesionalYFecha: jest.fn(),
    guardar: jest.fn(),
  };

  const mockPacientePort = {
    obtenerPorId: jest.fn(),
  };

  const mockEspecialistaPort = {
    obtenerPorId: jest.fn(),
  };

  const mockDisponibilidadService = {
    estaEnVentanaPermitida: jest.fn(),
    existeConflicto: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CitaController],
      providers: [
        CrearCitaManualUseCase, // Caso de uso real del negocio
        { provide: 'CitaRepository', useValue: mockCitaRepository },
        { provide: 'PacientePort', useValue: mockPacientePort },
        { provide: 'EspecialistaPort', useValue: mockEspecialistaPort },
        {
          provide: DisponibilidadAgendamientoService,
          useValue: mockDisponibilidadService,
        },

        // Mocks de soporte requeridos por la estructura del controlador
        { provide: ListarCitasProfesionalUseCase, useValue: {} },
        { provide: ObtenerDisponibilidadUseCase, useValue: {} },
        { provide: ObtenerCitasUseCase, useValue: {} },
        { provide: CancelarCitaUseCase, useValue: {} },
        { provide: ReagendarCitaUseCase, useValue: {} },
        { provide: FinalizarCitaUseCase, useValue: {} },
        { provide: MarcarNoAsistioUseCase, useValue: {} },
        { provide: ExportarCitasUseCase, useValue: {} },
        { provide: ListarTodasLasCitasUseCase, useValue: {} },
      ],
    }).compile();

    // Inicializamos NestJS como una aplicación web real para escuchar eventos HTTP
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * HISTORIA DE USUARIO 1:
   * Como recepcionista de la clínica, quiero registrar una cita de control para un paciente activo,
   * garantizando que el sistema asigne automáticamente la duración predefinida por el especialista.
   */
  describe('Criterio de Aceptación 1: Agendamiento Exitoso de Cita de Control', () => {
    it(
      'DADO QUE existe un paciente activo y un especialista disponible el Viernes a las 09:00 AM\n' +
        'CUANDO la recepcionista envía la solicitud de agendamiento mediante un HTTP POST\n' +
        'ENTONCES el sistema debe responder con estado 201 Created y retornar los datos de la cita con su duración correcta',
      async () => {
        // Configuración de condiciones de negocio (Dado que...)
        mockDisponibilidadService.estaEnVentanaPermitida.mockResolvedValue(
          true,
        );
        mockPacientePort.obtenerPorId.mockResolvedValue({
          id: 'paciente-123',
          activo: true,
        });
        mockCitaRepository.buscarPorPaciente.mockResolvedValue([]);
        mockEspecialistaPort.obtenerPorId.mockResolvedValue({
          id: 'medico-456',
          activo: true,
          intervaloAtencion: 20, // El médico atiende en bloques de 20 minutos
          horarioAtencion: {
            horaInicio: '07:00',
            horaFin: '13:00',
            diaSemana: ['Viernes'],
          },
        });
        mockCitaRepository.buscarPorProfesionalYFecha.mockResolvedValue([]);
        mockDisponibilidadService.existeConflicto.mockReturnValue(false);
        mockCitaRepository.guardar.mockResolvedValue(undefined);

        // Simulación de la acción del usuario por la red (Cuando...)
        const respuesta = await request(app.getHttpServer())
          .post('/citas') // Dispara una petición HTTP real al endpoint
          .send({
            pacienteId: 'paciente-123',
            especialistaId: 'medico-456',
            fechaHora: '2027-08-20T14:00:00.000Z', // Equivalente a un viernes por la mañana en horario de atención
            tipo: TipoCita.CONTROL,
          });

        // Validaciones finales de la historia de usuario (Entonces...)
        expect(respuesta.status).toBe(201); // Valida el código HTTP de éxito
        expect(respuesta.body).toHaveProperty('id');
        expect(respuesta.body.pacienteId).toBe('paciente-123');
        expect(respuesta.body.especialistaId).toBe('medico-456');
        expect(respuesta.body.duracion).toBe(20); // Verifica que se asignó la regla de negocio del especialista
        expect(mockCitaRepository.guardar).toHaveBeenCalled(); // Asegura que se guardó en persistencia
      },
    );
  });

  /**
   * HISTORIA DE USUARIO 2:
   * Como administrador de la clínica, quiero rechazar solicitudes de citas que estén fuera del
   * horario laboral del médico para resguardar la agenda real de la institución.
   */
  describe('Criterio de Aceptación 2: Rechazo por Horario Fuera de la Jornada Laboral', () => {
    it(
      'DADO QUE el especialista solo labora en la jornada matutina (07:00 a 13:00)\n' +
        'CUANDO se intenta agendar una cita por HTTP POST a las 04:00 AM de la madrugada\n' +
        'ENTONCES el sistema debe denegar la operación con código 400 Bad Request y no guardar nada en la BD',
      async () => {
        mockDisponibilidadService.estaEnVentanaPermitida.mockResolvedValue(
          true,
        );
        mockPacientePort.obtenerPorId.mockResolvedValue({
          id: 'paciente-123',
          activo: true,
        });
        mockCitaRepository.buscarPorPaciente.mockResolvedValue([]);
        mockEspecialistaPort.obtenerPorId.mockResolvedValue({
          id: 'medico-456',
          activo: true,
          intervaloAtencion: 20,
          horarioAtencion: {
            horaInicio: '07:00',
            horaFin: '13:00',
            diaSemana: ['Viernes'],
          },
        });

        // Intento de agendamiento en la madrugada (04:00 AM de Colombia -> 09:00 UTC)
        const respuesta = await request(app.getHttpServer())
          .post('/citas')
          .send({
            pacienteId: 'paciente-123',
            especialistaId: 'medico-456',
            fechaHora: '2027-08-20T09:00:00.000Z',
            tipo: TipoCita.CONTROL,
          });

        // Verificación de los criterios de aceptación de error
        expect(respuesta.status).toBe(400);
        expect(respuesta.body.message).toContain(
          'El especialista solo atiende de 07:00 a 13:00',
        );
        expect(mockCitaRepository.guardar).not.toHaveBeenCalled(); // No debe persistir datos inválidos
      },
    );
  });
});
