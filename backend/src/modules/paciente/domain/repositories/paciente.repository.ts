import { Paciente } from '../entities/paciente.entity';

export interface PacienteRepository {
  save(paciente: Paciente): Promise<void>;
  findAll(): Promise<Paciente[]>;
  findById(documento: string): Promise<Paciente | null>;
  update(especialista: Paciente): Promise<void>;
  delete(id: string): Promise<void>;

  buscarPorTermino(query: string): Promise<Paciente[]>;
}
