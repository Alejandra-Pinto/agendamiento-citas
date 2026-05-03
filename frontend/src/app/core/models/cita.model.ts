export interface Cita {
  id: string;
  pacienteId: string;
  especialistaId: string;
  especialistaNombre?: string;
  fechaHora: string;
  duracion: number;
  tipo: string;
  estado: 'PROGRAMADA' | 'CANCELADA' | 'REAGENDADA' | 'FINALIZADA';
  notas?: string;

  paciente?: {
    nombre?: string;
    nombres?: string;
    apellidos: string;
    documento: string;
    fotoUrl?: string;
    genero?: string;
    celular?: string;
  };
  especialista?: {
    nombre: string;
    apellidos: string;
    fotoUrl?: string;
  };
}
