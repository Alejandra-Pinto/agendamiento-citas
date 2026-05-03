import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitaRepository } from '../../domain/repositories/cita.repository';
import { Cita } from '../../domain/entities/cita.entity';
import { CitaOrmEntity } from './cita.orm-entity';
import { ConsultarCitasDto } from '../../application/dto/consultar-cita.dto';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class CitaRepositoryImpl implements CitaRepository {
  constructor(
    @InjectRepository(CitaOrmEntity)
    private repo: Repository<CitaOrmEntity>,
  ) {}

  async guardar(cita: Cita): Promise<void> {
    const entity = this.repo.create({
      id: cita.id,
      pacienteId: cita.pacienteId,
      especialistaId: cita.especialistaId,
      fechaHora: cita.fechaHora,
      duracion: cita.duracion,
      tipo: cita.tipo,
      estadoCita: cita.estado,
    });

    await this.repo.save(entity);
  }
  async buscarPorPaciente(pacienteId: string): Promise<Cita[]> {
    const entidades = await this.repo.find({
      where: { pacienteId: pacienteId } as FindOptionsWhere<CitaOrmEntity>,
      relations: ['especialista', 'paciente'],
      order: { fechaHora: 'DESC' },
    });
    return entidades.map((c) => this.mapToDomain(c));
  }

  async buscarPorProfesionalYFecha(
    especialistaId: string,
    fecha: string,
  ): Promise<Cita[]> {
    const queryBuilder = this.repo
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.especialista', 'especialista')
      .where('cita.especialistaId = :especialistaId', { especialistaId });

    const citas = await queryBuilder.getMany();

    return citas
      .filter((c) => {
        const fechaCita = c.fechaHora.toISOString().split('T')[0];
        return fechaCita === fecha;
      })
      .map((c) => this.mapToDomain(c));
  }

  async existeCitaEnHorario(
    especialistaId: string,
    fechaHora: Date,
  ): Promise<boolean> {
    const count = await this.repo.count({
      where: {
        especialistaId,
        fechaHora,
      },
    });

    return count > 0;
  }

  async buscarTodas(dto?: ConsultarCitasDto): Promise<Cita[]> {
    const where: FindOptionsWhere<CitaOrmEntity> = {};

    if (dto) {
      // 1. AGREGAR ESTA LÍNEA: Si viene el id, filtramos por él
      if (dto.id) where.id = dto.id;

      if (dto.pacienteId) where.pacienteId = dto.pacienteId;
      if (dto.especialistaId) where.especialistaId = dto.especialistaId;
    }

    const citas = await this.repo.find({
      where,
      relations: ['paciente', 'especialista'],
      // 2. OPCIONAL: Ordenar por fecha para que las listas siempre tengan sentido
      order: { fechaHora: 'DESC' },
    });

    return citas.map((c) => this.mapToDomain(c));
  }

  async buscarPorId(id: string): Promise<Cita | null> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['paciente', 'especialista'],
    });

    if (!c) return null;

    return this.mapToDomain(c);
  }

  /**
   * Método privado para evitar repetir la lógica de creación de la entidad Cita
   * e incluir los datos del paciente y especialista si existen.
   */
  p; /**
   * Método privado para mapear la entidad de base de datos al objeto de negocio (Dominio).
   * Usamos unknown y luego el tipo esperado para satisfacer la regla 'no-unsafe-assignment'.
   */
  private mapToDomain(c: CitaOrmEntity): Cita {
    // 1. Definimos las interfaces con los nombres plurales de tus ORMs
    interface PersonaData {
      nombres?: string;
      apellidos?: string; // El paciente tiene apellidos
      documento?: string; // El paciente usa documento como ID
      id?: string; // El especialista usa id como ID
    }

    // 2. Casteo seguro para el linter
    const p = c.paciente as unknown as PersonaData | undefined;
    const e = c.especialista as unknown as PersonaData | undefined;

    // 3. Construcción de nombres (Plural -> Singular para el Dominio)
    // Para el paciente concatenamos nombres y apellidos
    const nombreCompletoP = p
      ? `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim()
      : 'Paciente no cargado';

    // Para el especialista usamos su campo 'nombres'
    const nombreE = e?.nombres ?? 'Especialista no asignado';

    return new Cita(
      c.id,
      c.pacienteId,
      c.especialistaId,
      c.fechaHora,
      c.duracion,
      c.tipo,
      c.estadoCita,
      // Mapeo al objeto literal que espera la Entidad de Dominio
      p
        ? {
            nombre: nombreCompletoP || 'Sin nombre',
            documento: p.documento ?? 'S/D',
          }
        : undefined,
      e
        ? {
            nombre: nombreE,
          }
        : undefined,
    );
  }
}
