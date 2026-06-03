import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HistoriaClinicaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/historias-clinicas`;

  crearHistoriaClinica(dto: {
    citaId: string;
    pacienteId: string;
    especialistaId: string;
    descripcion: string;
  }): Observable<any> {
    return this.http.post<any>(this.api, dto);
  }

  obtenerHistoriaPorCita(citaId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/cita/${citaId}`);
  }
}
