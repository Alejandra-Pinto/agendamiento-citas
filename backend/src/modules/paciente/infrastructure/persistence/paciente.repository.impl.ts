/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PacienteRepository } from '../../domain/repositories/paciente.repository';
import { Paciente } from '../../domain/entities/paciente.entity';
import { PacienteOrmEntity } from './paciente.orm.entity';
import { ILike } from 'typeorm';
@Injectable()
export class PacienteRepositoryImpl implements PacienteRepository {
  constructor(
    @InjectRepository(PacienteOrmEntity)
    private readonly repo: Repository<PacienteOrmEntity>,
  ) {}

  async save(paciente: Paciente): Promise<void> {
    const entity = this.repo.create({
      documento: paciente.documento,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      celular: paciente.celular,
      genero: paciente.genero,
      fechaNacimiento: paciente.fechaNacimiento,
      email: paciente.email,
      activo: true,
    });

    await this.repo.save(entity);
  }

  async findAll(): Promise<Paciente[]> {
    const entities = await this.repo.find();

    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<Paciente | null> {
    const entity = await this.repo.findOneBy({ documento: id });

    if (!entity) return null;

    return this.toDomain(entity);
  }

  async update(paciente: Paciente): Promise<void> {
    await this.repo.update(
      { documento: paciente.documento },
      {
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        celular: paciente.celular,
        genero: paciente.genero,
        fechaNacimiento: paciente.fechaNacimiento,
        email: paciente.email,
      },
    );
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ documento: id });
  }

  async buscarPorTermino(query: string): Promise<Paciente[]> {
    const entities = await this.repo.find({
      where: [
        { documento: ILike(`%${query}%`) },
        { nombres: ILike(`%${query}%`) },
        { apellidos: ILike(`%${query}%`) },
      ],
      take: 5, // Limitamos a 5 para que el autocompletado sea rápido
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: PacienteOrmEntity): Paciente {
    return new Paciente(
      entity.documento,
      entity.nombres,
      entity.apellidos,
      entity.celular,
      entity.genero,
      entity.fechaNacimiento,
      entity.email,
    );
  }
}
