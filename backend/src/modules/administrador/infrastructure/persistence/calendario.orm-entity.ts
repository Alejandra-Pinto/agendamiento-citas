import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('calendario_clinica')
export class CalendarioOrmEntity {
  @PrimaryColumn({
    type: 'date',
  })
  fecha: string;

  @Column({
    type: 'boolean',
  })
  habilitado: boolean;
}
