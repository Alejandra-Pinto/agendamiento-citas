/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CrearPacienteUseCase } from './crear-paciente.usecase';
import { BadRequestException } from '@nestjs/common';
import { GeneroEnum } from '../../domain/entities/paciente.entity';

describe('CrearPacienteUseCase', () => {
  let useCase: CrearPacienteUseCase;
  let mockRepo: any;
  let mockValidacion: any;
  let mockKeycloak: any; // <--- 1. Agregamos el mock para Keycloak

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };
    mockValidacion = {
      validarDocumento: jest.fn(),
      validarCelular: jest.fn(),
    };
    // 2. Definimos el mock de Keycloak con el método que falta
    mockKeycloak = {
      crearUsuario: jest.fn().mockResolvedValue({ id: 'keycloak-123' }),
    };

    // 3. Pasamos el tercer parámetro al constructor
    useCase = new CrearPacienteUseCase(mockRepo, mockValidacion, mockKeycloak);
  });

  it('debería crear un paciente exitosamente si no existe y los datos son válidos', async () => {
    const dto = {
      documento: '1020304050',
      nombres: 'Ana',
      apellidos: 'García',
      celular: '3101234567',
      generoP: GeneroEnum.FEMENINO,
      email: 'ana@mail.com',
    };

    mockRepo.findById.mockResolvedValue(null);

    const resultado = await useCase.ejecutar(dto as any);

    expect(mockValidacion.validarDocumento).toHaveBeenCalledWith(dto.documento);
    expect(mockValidacion.validarCelular).toHaveBeenCalledWith(dto.celular);

    // Verificamos que también se intente crear en Keycloak
    expect(mockKeycloak.crearUsuario).toHaveBeenCalled();

    expect(mockRepo.save).toHaveBeenCalled();
    expect(resultado.documento).toBe(dto.documento);
  });

  it('debería lanzar BadRequestException si el paciente ya existe', async () => {
    const dto = { documento: '1020304050', celular: '3101234567' };
    mockRepo.findById.mockResolvedValue({ documento: '1020304050' });

    await expect(useCase.ejecutar(dto as any)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
