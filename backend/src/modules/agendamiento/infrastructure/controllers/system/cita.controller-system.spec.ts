/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CitaController } from '../cita.controller'; // Sube 1 nivel a /controllers

// Sueden 3 niveles para llegar a /application y /domain
import { CrearCitaManualUseCase } from '../../../application/use-cases/crear-cita-manual.usecase';
import { CrearCitaDto } from '../../../application/dto/crear-cita.dto';
import { TipoCita } from '../../../domain/entities/cita.entity';
import { DisponibilidadAgendamientoService } from '../../../domain/services/disponibilidad-agendamiento.service';

// Dependencias adicionales del controlador requeridas para compilar el módulo de pruebas
import { ListarCitasProfesionalUseCase } from '../../../application/use-cases/listar-citas-profesional.usecase';
import { ObtenerDisponibilidadUseCase } from '../../../application/use-cases/obtener-disponibilidad.usecase';
import { ObtenerCitasUseCase } from '../../../application/use-cases/obtener-citas.usecase';
import { CancelarCitaUseCase } from '../../../application/use-cases/cancelar-cita.usecase';
import { ReagendarCitaUseCase } from '../../../application/use-cases/reagendar-cita.usecase';
import { FinalizarCitaUseCase } from '../../../application/use-cases/finalizar-cita.usecase';
import { MarcarNoAsistioUseCase } from '../../../application/use-cases/noAsistida-cita.usecase';
import { ExportarCitasUseCase } from '../../../application/use-cases/exportar-citas.usecase';
import { ListarTodasLasCitasUseCase } from '../../../application/use-cases/listar-citas-general-citas.usecase';

describe('CitaController (Prueba de Sistema - Caja Negra)', () => {
  let controller: CitaController;

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitaController],
      providers: [
        CrearCitaManualUseCase, // Instanciación del Caso de Uso Real
        { provide: 'CitaRepository', useValue: mockCitaRepository },
        { provide: 'PacientePort', useValue: mockPacientePort },
        { provide: 'EspecialistaPort', useValue: mockEspecialistaPort },
        {
          provide: DisponibilidadAgendamientoService,
          useValue: mockDisponibilidadService,
        },

        // Mocks obligatorios de soporte para el controlador
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

    controller = module.get<CitaController>(CitaController);
  });

  describe('Flujo Completo del Sistema - Crear Cita Real', () => {
    it('Debería procesar la cita cruzando exitosamente todas las validaciones reales del caso de uso', async () => {
      // AJUSTE CLAVE: Usamos las 14:00:00 UTC para que en el huso de Colombia (GMT-5) se interprete de forma local
      // como las 09:00 AM, logrando entrar perfectamente en el rango laboral de 07:00 a 13:00.
      const dto: CrearCitaDto = {
        pacienteId: 'paciente-real-123',
        especialistaId: 'medico-real-456',
        fechaHora: new Date('2027-08-20T14:00:00.000Z'),
        tipo: TipoCita.CONTROL,
      };

      // 1. Simular Validación de Ventana Permitida en el dominio
      mockDisponibilidadService.estaEnVentanaPermitida.mockResolvedValue(true);

      // 2. Simular Validación de Paciente Activo
      mockPacientePort.obtenerPorId.mockResolvedValue({
        id: 'paciente-real-123',
        activo: true,
      });

      // 3. Simular Validación de Unicidad diaria del Paciente
      mockCitaRepository.buscarPorPaciente.mockResolvedValue([]);

      // 4. Simular Datos del Especialista (El 20 de agosto de 2027 es un día Viernes)
      mockEspecialistaPort.obtenerPorId.mockResolvedValue({
        id: 'medico-real-456',
        activo: true,
        intervaloAtencion: 20,
        horarioAtencion: {
          horaInicio: '07:00',
          horaFin: '13:00',
          diaSemana: ['Viernes'],
        },
      });

      // 5. Simular Validación de Conflictos Horarios en agenda
      mockCitaRepository.buscarPorProfesionalYFecha.mockResolvedValue([]);
      mockDisponibilidadService.existeConflicto.mockReturnValue(false);

      // Persistencia final esperada
      mockCitaRepository.guardar.mockResolvedValue(undefined);

      // --- EJECUCIÓN DEL SISTEMA ---
      const resultado = await controller.crear(dto);

      // --- ASSERTIONS DE CAJA NEGRA ---
      expect(resultado).toBeDefined();
      expect(resultado.pacienteId).toBe('paciente-real-123');
      expect(resultado.especialistaId).toBe('medico-real-456');
      expect(resultado.duracion).toBe(20);

      // Aseguramos el comportamiento extremo a extremo
      expect(mockCitaRepository.guardar).toHaveBeenCalled();
    });

    it('Debería denegar la operación si el especialista no labora el día de la cita', async () => {
      const dto: CrearCitaDto = {
        pacienteId: 'paciente-real-123',
        especialistaId: 'medico-real-456',
        fechaHora: new Date('2027-08-20T14:00:00.000Z'),
        tipo: TipoCita.CONTROL,
      };

      mockDisponibilidadService.estaEnVentanaPermitida.mockResolvedValue(true);
      mockPacientePort.obtenerPorId.mockResolvedValue({
        id: 'paciente-real-123',
        activo: true,
      });
      mockCitaRepository.buscarPorPaciente.mockResolvedValue([]);

      // Modificamos el mock para que atienda solo los Lunes, forzando la falla de día laboral
      mockEspecialistaPort.obtenerPorId.mockResolvedValue({
        id: 'medico-real-456',
        activo: true,
        intervaloAtencion: 20,
        horarioAtencion: {
          horaInicio: '07:00',
          horaFin: '13:00',
          diaSemana: ['Lunes'],
        },
      });

      // --- VERIFICACIÓN ---
      await expect(controller.crear(dto)).rejects.toThrow(BadRequestException);
      expect(mockCitaRepository.guardar).not.toHaveBeenCalled();
    });
  });
});
