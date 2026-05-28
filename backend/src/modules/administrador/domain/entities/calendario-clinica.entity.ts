export class CalendarioClinica {
  constructor(
    public readonly fecha: Date,
    public readonly habilitado: boolean,
  ) {}

  esDiaHabilitado(): boolean {
    return this.habilitado;
  }
}
