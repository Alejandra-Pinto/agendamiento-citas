import { CommonModule } from '@angular/common';
import { Component, inject, computed, effect } from '@angular/core';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { SidebarService } from '../../../core/services/sidebar.service'; // Asegúrate de la ruta correcta
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
})
export class HeaderComponent {
  private keycloak = inject(KeycloakService);
  public authService = inject(AuthStateService);
  public sidebarService = inject(SidebarService); // <-- Inyectamos el servicio aquí

  constructor() {
  effect(() => {
    console.log("¿El sidebar está abierto?:", this.sidebarService.isSidebarOpen());
  });
}
  public username = computed(() => {
    const profile = this.keycloak.getKeycloakInstance().profile;
    return profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario';
  });
  
  public mainRole = computed(() => {
    if (this.authService.isAdmin()) return 'Administrador';
    if (this.authService.isEspecialista()) return 'Especialista';
    return 'Paciente';
  });

  alternarMenu() {
    console.log('¡Clic detectado en el botón de hamburguesa del Header!');
    this.sidebarService.toggleSidebar();
  }
}