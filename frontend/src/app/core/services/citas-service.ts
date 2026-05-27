import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../models/cita.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CitasService {
  private api = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  // Crear cita
  crearCita(data: any): Observable<any> {
    return this.http.post(`${this.api}`, data);
  }

  // Listar citas por especialista y fecha
  listarCitas(especialistaId: string, fecha: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.api}`, {
      params: { especialistaId, fecha },
    });
  }

  // Disponibilidad
  getDisponibilidad(especialistaId: string, fecha: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/disponibilidad`, {
      params: { especialistaId, fecha },
    });
  }



  // Reporte
  exportarReporte(especialistaId: string, fecha: string, formato: 'pdf' | 'excel') {
    const params = new HttpParams()
      .set('especialistaId', especialistaId)
      .set('fecha', fecha)
      .set('formato', formato);

    return this.http.get(`${this.api}/exportar`, {
      params,
      responseType: 'blob', //CRÍTICO: Para recibir archivos binarios
    });
  }
  getCitasParaDashboard(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.api}/resumen-disponibilidad`);
  }

  obtenerCitasPorPaciente(pacienteId: string): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.api}/paciente/${pacienteId}`);
  }

  obtenerCitaPorId(id: string): Observable<Cita> {
    return this.http.get<Cita>(`${this.api}/${id}`);
  }

  // En citas.service.ts

  actualizarEstadoCita(id: string, estado: string): Observable<any> {
    let endpoint = '';

    switch (estado) {
      case 'PROGRAMADA':
        // Mapeamos PROGRAMADA al endpoint que el backend usa para revivir o limpiar citas
        endpoint = 'reagendar'; 
        break;
      case 'FINALIZADA':
        endpoint = 'finalizar';
        break;
      case 'CANCELADA':
        endpoint = 'cancelar';
        break;
      case 'NO_ASISTIO':
        endpoint = 'no-asistio';
        break;
      case 'REAGENDADA':
        endpoint = 'reagendar';
        break;
      default:
        console.error('Estado no soportado:', estado);
        return new Observable((sub) => sub.error({ error: { message: 'Estado no reconocido' } }));
    }

    // Se envía un objeto vacío {} como Body para evitar errores de protocolo en el PATCH
    return this.http.patch(`${this.api}/${id}/${endpoint}`, {});
  }

  reagendarCita(id: string, fechaHora: string): Observable<any> {
    // Aquí enviamos la fechaHora que el controlador de NestJS espera
    return this.http.patch(`${this.api}/${id}/reagendar`, { fechaHora });
  }

  actualizarNotasCita(id: string, data: { notas?: string; tags?: string }): Observable<any> {
    return this.http.patch(`${this.api}/${id}`, data);
  }
}
