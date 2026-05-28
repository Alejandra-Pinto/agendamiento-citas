import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CitaController } from '../cita.controller';
import { CrearCitaManualUseCase } from '../../../application/use-cases/crear-cita-manual.usecase';
import { ListarCitasProfesionalUseCase } from '../../../application/use-cases/listar-citas-profesional.usecase';
import { ObtenerDisponibilidadUseCase } from '../../../application/use-cases/obtener-disponibilidad.usecase';
import { ObtenerCitasUseCase } from '../../../application/use-cases/obtener-citas.usecase';
import { CancelarCitaUseCase } from '../../../application/use-cases/cancelar-cita.usecase';
import { ReagendarCitaUseCase } from '../../../application/use-cases/reagendar-cita.usecase';
import { FinalizarCitaUseCase } from '../../../application/use-cases/finalizar-cita.usecase';
import { MarcarNoAsistioUseCase } from '../../../application/use-cases/noAsistida-cita.usecase';
import { ExportarCitasUseCase } from '../../../application/use-cases/exportar-citas.usecase';
import { ListarTodasLasCitasUseCase } from '../../../application/use-cases/listar-citas-general-citas.usecase';
import { CrearCitaDto } from '../../../application/dto/crear-cita.dto';

describe('CitaController (Prueba de Integración)', () => {
  let controller: CitaController;
  let crearCitaUseCase: CrearCitaManualUseCase;

  beforeEach(async () => {
    // 1. Creamos el entorno integrado de NestJS simulando el contenedor de dependencias
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitaController],
      providers: [
        // Declaramos mocks simplificados de todos los Casos de Uso que el constructor exige
        {
          provide: CrearCitaManualUseCase,
          useValue: { ejecutar: jest.fn() },
        },
        {
          provide: ListarCitasProfesionalUseCase,
          useValue: { ejecutar: jest.fn() },
        },
        {
          provide: ObtenerDisponibilidadUseCase,
          useValue: { ejecutar: jest.fn() },
        },
        { provide: ObtenerCitasUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: CancelarCitaUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: ReagendarCitaUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: FinalizarCitaUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: MarcarNoAsistioUseCase, useValue: { ejecutar: jest.fn() } },
        { provide: ExportarCitasUseCase, useValue: { ejecutar: jest.fn() } },
        {
          provide: ListarTodasLasCitasUseCase,
          useValue: { ejecutar: jest.fn() },
        },
      ],
    }).compile();

    // 2. Extraemos las instancias lógicas para interactuar con ellas
    controller = module.get<CitaController>(CitaController);
    crearCitaUseCase = module.get<CrearCitaManualUseCase>(
      CrearCitaManualUseCase,
    );
  });

  it('Debería estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /citas - Crear Cita', () => {
    it('Debería integrarse exitosamente con CrearCitaManualUseCase cuando el DTO es válido', async () => {
      // Arreglar (Given)
      const mockDto: CrearCitaDto = {
        pacienteId: 'paciente-uuid-123',
        especialistaId: 'especialista-uuid-456',
        fechaHora: new Date('2026-06-15T14:30:00.000Z'),
      };

      const mockResultadoCita = {
        id: 'cita-generada-789',
        pacienteId: 'paciente-uuid-123',
        especialistaId: 'especialista-uuid-456',
        fechaHora: mockDto.fechaHora,
        estado: 'AGENDADA',
      };

      // Simulamos que el caso de uso procesa y responde correctamente
      jest
        .spyOn(crearCitaUseCase, 'ejecutar')
        .mockResolvedValue(mockResultadoCita);

      // Actuar (When)
      const resultado = await controller.crear(mockDto);

      // Afirmar (Then) - Verificaciones clave de integración
      expect(crearCitaUseCase.ejecutar).toHaveBeenCalledWith(mockDto); // Valida que el controlador le pase los datos limpios al caso de uso
      expect(resultado).toEqual(mockResultadoCita); // Valida que la respuesta del negocio retorne intacta al cliente HTTP
    });

    it('Debería lanzar un BadRequestException genérico cuando el caso de uso falla con un error desconocido', async () => {
      // Arreglar (Given)
      const mockDto: CrearCitaDto = {
        pacienteId: 'paciente-invalido',
        especialistaId: 'especialista-invalido',
        fechaHora: new Date(),
      };

      // Forzamos un error de negocio inesperado (ej. fallo de base de datos)
      jest
        .spyOn(crearCitaUseCase, 'ejecutar')
        .mockRejectedValue(new Error('Fallo crítico en BD'));

      // Actuar y Afirmar (When & Then)
      await expect(controller.crear(mockDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.crear(mockDto)).rejects.toThrow(
        'Error al crear la cita',
      );
    });
  });
});
