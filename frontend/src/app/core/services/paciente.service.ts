import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PacienteService {
  private api = `${environment.apiUrl}/pacientes`;

  constructor(private http: HttpClient) {}

  // Método para conectar con el backend y Keycloak
  crearPaciente(datos: any): Observable<any> {
    return this.http.post<any>(this.api, datos);
  }

  // Obtener un paciente por su ID/Documento
  getPaciente(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  // Buscar sugerencias para el autocompletado
  buscarSugerencias(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/buscar/sugerencias?q=${termino}`);
  }
}
