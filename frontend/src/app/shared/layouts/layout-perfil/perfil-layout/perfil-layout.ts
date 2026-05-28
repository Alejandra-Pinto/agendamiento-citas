import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { Footer } from '../../../components/footer/footer';
import { PerfilNavbarComponent } from '../../../components/perfil-navbar/perfil-navbar';

@Component({
  selector: 'app-perfil-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Footer, PerfilNavbarComponent],
  templateUrl: './perfil-layout.html',
})
export class PerfilLayoutComponent {}
