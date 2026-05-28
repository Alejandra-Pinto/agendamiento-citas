/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CalendarioRepository } from '../../domain/repositories/calendario.repository';
import { CalendarioClinica } from '../../domain/entities/calendario-clinica.entity';
import { CalendarioOrmEntity } from './calendario.orm-entity';

@Injectable()
export class CalendarioRepositoryImpl
  implements CalendarioRepository
{
  constructor(
    @InjectRepository(CalendarioOrmEntity)
    private readonly repo: Repository<CalendarioOrmEntity>,
  ) {}

  async guardar(dia: CalendarioClinica): Promise<void> {
    const orm = this.repo.create({
      fecha: dia.fecha.toISOString().split('T')[0],
      habilitado: dia.habilitado,
    });

    await this.repo.save(orm);
  }

  async buscarPorFecha(
    fecha: Date,
  ): Promise<CalendarioClinica | null> {
    const fechaTexto = fecha.toISOString().split('T')[0];

    const resultado = await this.repo.findOne({
      where: {
        fecha: fechaTexto,
      },
    });

    if (!resultado) {
      return null;
    }

    return new CalendarioClinica(
      new Date(resultado.fecha),
      resultado.habilitado,
    );
  }

  async listarPorMes(
    anio: number,
    mes: number,
  ): Promise<CalendarioClinica[]> {
    const mesTexto = String(mes).padStart(2, '0');

    const resultados = await this.repo
      .createQueryBuilder('calendario')
      .where(
        `TO_CHAR(calendario.fecha, 'YYYY-MM') = :fecha`,
        {
          fecha: `${anio}-${mesTexto}`,
        },
      )
      .getMany();

    return resultados.map(
      (r) =>
        new CalendarioClinica(
          new Date(r.fecha),
          r.habilitado,
        ),
    );
  }
}
