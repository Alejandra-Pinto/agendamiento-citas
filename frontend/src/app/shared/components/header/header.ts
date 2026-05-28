import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { KeycloakService } from 'keycloak-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
})
export class HeaderComponent {
  private keycloak = inject(KeycloakService);
  public authService = inject(AuthStateService);

  // Obtenemos el nombre real del token
  public username = computed(() => {
    const profile = this.keycloak.getKeycloakInstance().profile;
    return profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario';
  });

  // Obtenemos el rol principal para mostrar bajo el nombre
  public mainRole = computed(() => {
    if (this.authService.isAdmin()) return 'Administrador';
    if (this.authService.isEspecialista()) return 'Especialista';
    return 'Paciente';
  });
}
