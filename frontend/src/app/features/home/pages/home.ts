import { Component, inject } from '@angular/core';
import { Header } from "../components/headerHome/header";
import { PorQueElegir } from '../components/por-que-elegir/por-que-elegir';
import { Horario } from '../components/horario/horario';
import { Mapa } from '../components/mapa/mapa';
import { Footer } from '../../../shared/components/footer/footer';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { HorarioGeneral } from '../../../core/models/horario-general.model';

@Component({
  selector: 'app-home',
  imports: [Header, PorQueElegir, Horario, Mapa, Footer, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private adminService = inject(AdminService);

  horarioGeneral: HorarioGeneral[] = [];

  ngOnInit() {
    this.cargarHorario();
  }

  cargarHorario() {
    this.adminService.obtenerHorarioGeneral()
      .subscribe({
        next: (data) => {
          console.log('HORARIO BACKEND:', data);
          this.horarioGeneral = data;
        },
        error: (err) => {
          console.error(err);
        }
      });
  }
}
