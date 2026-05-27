/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { Cita, EstadoCita, TipoCita } from '../../domain/entities/cita.entity';
import type { CitaRepository } from '../../domain/repositories/cita.repository';
import { CrearCitaDto } from '../dto/crear-cita.dto';
import { randomUUID } from 'crypto';
import type { EspecialistaPort } from '../../domain/ports/especialista.port';
import type { PacientePort } from '../../domain/ports/paciente.port';
import { DisponibilidadAgendamientoService } from '../../domain/services/disponibilidad-agendamiento.service';

interface HorarioAtencion {
  horaInicio: string;
  horaFin: string;
  diaSemana: string[];
}

@Injectable()
export class CrearCitaManualUseCase {
  private readonly logger = new Logger(CrearCitaManualUseCase.name);

  constructor(
    @Inject('CitaRepository') private readonly citaRepository: CitaRepository,
    private readonly disponibilidadService: DisponibilidadAgendamientoService,
    @Inject('EspecialistaPort')
    private readonly especialistaPort: EspecialistaPort,
    @Inject('PacientePort') private readonly pacientePort: PacientePort,
  ) {}

  async ejecutar(dto: CrearCitaDto) {
    this.logger.log(
      `Intentando crear cita para paciente ${dto.pacienteId} con especialista ${dto.especialistaId}`,
    );

    const fechaCita = new Date(dto.fechaHora);
    const ahora = new Date();

    // 1. Validación de Fecha Pasada
    if (fechaCita.getTime() < ahora.getTime()) {
      this.logger.warn(
        `Intento de agendar cita en fecha pasada: ${dto.fechaHora}`,
      );

      throw new BadRequestException(
        'No es posible agendar una cita en el pasado. Por favor, selecciona una fecha futura.',
      );
    }

    // 2. Validación de Antelación (30 minutos)
    const minutosAntelacion = 30;
    const tiempoMinimo = ahora.getTime() + minutosAntelacion * 60000;

    if (fechaCita.getTime() < tiempoMinimo) {
      this.logger.warn(
        `Cita creada sin cumplir tiempo mínimo de antelación: ${dto.fechaHora}`,
      );

      throw new BadRequestException(
        `Por políticas de la clínica, las citas deben programarse con al menos ${minutosAntelacion} minutos de antelación.`,
      );
    }

    // 3. Validar ventana permitida
    const enVentana =
      await this.disponibilidadService.estaEnVentanaPermitida(fechaCita);

    if (!enVentana) {
      this.logger.warn(
        `Fecha fuera de ventana permitida: ${dto.fechaHora}`,
      );

      throw new BadRequestException(
        'La fecha seleccionada está fuera del rango permitido por la clínica',
      );
    }

    // 4. Validar paciente
    const paciente = await this.pacientePort.obtenerPorId(dto.pacienteId);

    if (!paciente || !paciente.activo) {
      this.logger.warn(
        `Paciente inválido o inactivo: ${dto.pacienteId}`,
      );

      throw new BadRequestException('Paciente no válido o inactivo');
    }

    // 5. Validar especialista
    const especialista = await this.especialistaPort.obtenerPorId(
      dto.especialistaId,
    );

    if (!especialista || !especialista.activo) {
      this.logger.warn(
        `Especialista no disponible: ${dto.especialistaId}`,
      );

      throw new BadRequestException('Especialista no disponible');
    }

    // 6. Validación de días laborales
    const horario = especialista.horarioAtencion as unknown as HorarioAtencion;

    const diasSemanaMap: Record<number, string> = {
      0: 'Domingo',
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
    };

    const nombreDiaCita = diasSemanaMap[fechaCita.getDay()];

    const normalizar = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const diasLaborales = horario?.diaSemana || [];

    const trabajaHoy = diasLaborales.some(
      (d: string) => normalizar(d) === normalizar(nombreDiaCita),
    );

    if (!trabajaHoy) {
      const diasNormalizados = diasLaborales.map((d: string) => {
        const base = normalizar(d);

        if (base === 'miercoles') return 'Miércoles';

        return base.charAt(0).toUpperCase() + base.slice(1);
      });

      const listaUnica = Array.from(new Set(diasNormalizados)).join(', ');

      this.logger.warn(
        `Especialista ${dto.especialistaId} no atiende el día ${nombreDiaCita}`,
      );

      throw new BadRequestException(
        `La doctora no atiende los ${nombreDiaCita}. Sus días de atención son: ${listaUnica}.`,
      );
    }

    // 7. Calcular duración
    const duracionNueva = this.calcularDuracion(
      dto.tipo,
      especialista.intervaloAtencion,
    );

    // 8. Validar horario específico
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [hInicio, mInicio] = especialista.horarioAtencion.horaInicio
      .split(':')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .map(Number);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [hFin, mFin] = especialista.horarioAtencion.horaFin
      .split(':')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .map(Number);

    const minutosCitaInicio =
      fechaCita.getHours() * 60 + fechaCita.getMinutes();

    const minutosCitaFin = minutosCitaInicio + duracionNueva;

    const minutosLimiteInicio = hInicio * 60 + mInicio;
    const minutosLimiteFin = hFin * 60 + mFin;

    if (
      minutosCitaInicio < minutosLimiteInicio ||
      minutosCitaFin > minutosLimiteFin
    ) {
      this.logger.warn(
        `Horario fuera de jornada laboral para especialista ${dto.especialistaId}`,
      );

      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `El especialista solo atiende de ${especialista.horarioAtencion.horaInicio} a ${especialista.horarioAtencion.horaFin}`,
      );
    }

    // 9. Validar conflictos
    const fechaStr = fechaCita.toISOString().split('T')[0];

    const citasDelDia = await this.citaRepository.buscarPorProfesionalYFecha(
      dto.especialistaId,
      fechaStr,
    );

    const tieneConflicto = this.disponibilidadService.existeConflicto(
      fechaCita,
      duracionNueva,
      citasDelDia,
    );

    if (tieneConflicto) {
      this.logger.warn(
        `Conflicto de horario para especialista ${dto.especialistaId} en ${dto.fechaHora}`,
      );

      throw new BadRequestException(
        'El horario ya está ocupado por otra cita',
      );
    }

    // 10. Crear cita
    const cita = new Cita(
      randomUUID(),
      dto.pacienteId,
      dto.especialistaId,
      fechaCita,
      duracionNueva,
      dto.tipo,
      EstadoCita.PROGRAMADA,
    );

    await this.citaRepository.guardar(cita);

    this.logger.log(
      `Cita creada correctamente con id ${cita.id}`,
    );

    return cita;
  }

  private calcularDuracion(tipo: TipoCita, intervaloBase: number): number {
    return tipo === TipoCita.PRIMERA_VEZ
      ? intervaloBase + 10
      : intervaloBase;
  }
}
