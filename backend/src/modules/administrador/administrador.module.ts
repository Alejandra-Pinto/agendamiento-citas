/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministradorController } from './infrastructure/controllers/administrador.controller';
import { ConfigurarAgendaUseCase } from './application/use-cases/configurar.agenda.usecase';
import { ObtenerAgendaEspecialistaUseCase } from './application/use-cases/obtener.agenda.usecase';
import { ObtenerConfiguracionSistemaUseCase } from './application/use-cases/obtener.configuracion.sistema.usecase';
import { ConfigurarSistemaUseCase } from './application/use-cases/configurar.sistema.usecase';
import { AdministradorRepositoryImpl } from './infrastructure/persistence/configuracion.repository.impl';
import { ConfiguracionSistemaOrmEntity } from './infrastructure/persistence/configuracion-sistema.orm.entity';
import { EspecialistaAgendaPort } from './domain/ports/especialista-agenda.port';
import { EspecialistaAgendaAdapter } from './infrastructure/adapters/especialista-agenda.adapter';
import { EspecialistaModule } from '../especialista/especialista.module';
import { ConfiguracionRepository } from './domain/repositories/configuracion.repository';
import { CalendarioOrmEntity } from './infrastructure/persistence/calendario.orm-entity';
import { ConfigurarDiaClinicaUseCase } from './application/use-cases/configurar-dia-clinica.usecase';
import { ObtenerCalendarioUseCase } from './application/use-cases/obtener-calendario.usecase';
import { CalendarioClinicaService } from './domain/services/calendario-clinica.service';
import { CalendarioRepository } from './domain/repositories/calendario.repository';
import { CalendarioRepositoryImpl } from './infrastructure/persistence/calendario.repository.impl';
import { CalendarioController } from './infrastructure/controllers/calendario.controller';
import { HorarioGeneralService } from './domain/services/horario-general.service';
import { ObtenerHorarioGeneralUseCase } from './application/use-cases/obtener-horario-general.usecase';

@Module({
  imports: [
    EspecialistaModule,
    TypeOrmModule.forFeature([CalendarioOrmEntity, ConfiguracionSistemaOrmEntity]),
  ],
  controllers: [CalendarioController, AdministradorController],
  providers: [
    ConfigurarAgendaUseCase,
    ObtenerAgendaEspecialistaUseCase,
    ObtenerConfiguracionSistemaUseCase,
    ConfigurarSistemaUseCase,
    ConfigurarDiaClinicaUseCase,
    ObtenerCalendarioUseCase,
    ObtenerHorarioGeneralUseCase,
    CalendarioClinicaService,
    HorarioGeneralService,
    {
      provide: ConfiguracionRepository,
      useClass: AdministradorRepositoryImpl,
    },
    {
      provide: EspecialistaAgendaPort,
      useClass: EspecialistaAgendaAdapter,
    },
    {
      provide: CalendarioRepository,
      useClass: CalendarioRepositoryImpl,
    },
  ],
  exports: [ConfiguracionRepository],
})
export class AdministradorModule {}
