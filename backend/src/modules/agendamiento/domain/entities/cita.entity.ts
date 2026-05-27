export enum TipoCita {
  PRIMERA_VEZ = 'PRIMERA_VEZ',
  CONTROL = 'CONTROL',
}

export enum EstadoCita {
  PROGRAMADA = 'PROGRAMADA', // confirmada
  CANCELADA = 'CANCELADA', // cancelada manualmente
  REAGENDADA = 'REAGENDADA', // se movió a otra fecha
  FINALIZADA = 'FINALIZADA', // ya se atendió
  NO_ASISTIO = 'NO_ASISTIO', // paciente no llegó
}

export class Cita {
  constructor(
    public id: string,
    public pacienteId: string,
    public especialistaId: string,
    public fechaHora: Date,
    public duracion: number,
    public tipo: TipoCita,
    public estado: EstadoCita = EstadoCita.PROGRAMADA,
    public paciente?: { nombre: string; documento: string },
    public especialista?: { nombre: string; especialidad?: string },
  ) {
    if (duracion <= 0) throw new Error('La duración debe ser mayor a 0');
    if (!especialistaId || !pacienteId)
      throw new Error('Especialista y Paciente son obligatorios');
  }

  cancelar() {
    if (this.estado === EstadoCita.CANCELADA) {
      throw new Error('La cita ya está cancelada');
    }

    if (this.estado === EstadoCita.FINALIZADA) {
      throw new Error('No puedes cancelar una cita finalizada');
    }

    this.estado = EstadoCita.CANCELADA;
  }

  reagendar(nuevaFecha: Date) {
    // Comparamos si es la misma fecha y hora original para identificar una reversión de error
    const esMismaFechaOriginal =
      new Date(this.fechaHora).getTime() === new Date(nuevaFecha).getTime();

    if (!esMismaFechaOriginal) {
      // Validaciones estrictas solo si es una reprogramación real (cambio de fecha)
      if (nuevaFecha <= new Date()) {
        throw new Error('No se puede reagendar a una fecha pasada');
      }
      if (this.estado === EstadoCita.FINALIZADA) {
        throw new Error('No se puede reagendar una cita ya finalizada');
      }

      // Si cambia la fecha de verdad, el estado pasa a REAGENDADA
      this.estado = EstadoCita.REAGENDADA;
    } else {
      // Si es una restauración por error (misma fecha), el estado vuelve a estar PROGRAMADA
      this.estado = EstadoCita.PROGRAMADA;
    }

    // La fecha se sobrescribe (si es la misma, se mantiene idéntica)
    this.fechaHora = nuevaFecha;
  }

  finalizar() {
    if (
      this.estado !== EstadoCita.PROGRAMADA &&
      this.estado !== EstadoCita.REAGENDADA
    ) {
      throw new Error(
        'Solo se pueden finalizar citas programadas o reagendadas',
      );
    }
    this.estado = EstadoCita.FINALIZADA;
  }

  marcarNoAsistio() {
    this.estado = EstadoCita.NO_ASISTIO;
  }
}
