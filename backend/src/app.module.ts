import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgendamientoModule } from './modules/agendamiento/agendamiento.module';
import { PacienteModule } from './modules/paciente/paciente.module';
import { EspecialistaModule } from './modules/especialista/especialista.module';
import { AdministradorModule } from './modules/administrador/administrador.module';
import { AutenticacionModule } from './modules/autenticacion/autenticacion.module';
import { HistoriaClinicaModule } from './modules/historia-clinica/historia-clinica.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que el .env esté disponible en toda la app
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',

      ...(process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false,
            },
          }
        : {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: '020406',
            database: 'piedra_azul',
          }),

      autoLoadEntities: true,
      synchronize: true,
    }),
    AgendamientoModule,
    PacienteModule,
    EspecialistaModule,
    AdministradorModule,
    AutenticacionModule,
    HistoriaClinicaModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
