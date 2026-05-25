// especialista.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EspecialistaService {
  private apiUrl = `${environment.apiUrl}/especialistas`;

  constructor(private http: HttpClient) {}

  listarEspecialistas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
