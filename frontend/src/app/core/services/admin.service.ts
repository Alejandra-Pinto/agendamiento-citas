import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HorarioGeneral } from '../models/horario-general.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private api = `${environment.apiUrl}/administrador`;

  constructor(private http: HttpClient) {}

  // GLOBAL
  obtenerConfiguracionGlobal() {
    return this.http.get(`${this.api}/configuracion-global`);
  }

  actualizarConfiguracionGlobal(data: any) {
    return this.http.patch(`${this.api}/configuracion-global`, data);
  }

  obtenerHorarioGeneral() {
    return this.http.get<HorarioGeneral[]>(`${this.api}/horario-general`);
  }

  // ESPECIALISTA
  obtenerAgendaEspecialista(id: string) {
    return this.http.get(`${this.api}/especialista/${id}/agenda`);
  }

  actualizarAgendaEspecialista(id: string, data: any) {
    return this.http.patch(`${this.api}/especialista/${id}/configurar-agenda`, data);
  }
}
