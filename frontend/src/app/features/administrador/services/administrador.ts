import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {

  private api = `${environment.apiUrl}/administrador`;

  constructor(private http: HttpClient) {}

  obtenerConfiguracion() {
    return this.http.get(`${this.api}/configuracion`);
  }

  guardarConfiguracion(data: any) {
    return this.http.post(`${this.api}/configuracion`, data);
  }
}
