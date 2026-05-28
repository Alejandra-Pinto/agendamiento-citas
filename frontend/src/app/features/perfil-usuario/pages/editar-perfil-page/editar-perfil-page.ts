import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { PerfilAvatarComponent } from '../../components/perfil-avatar/perfil-avatar';
import { PerfilFormularioComponent } from '../../components/perfil-formulario/perfil-formulario';
import { PacienteService } from '../../../../core/services/paciente.service'; // <-- Importamos tu servicio

@Component({
  selector: 'app-editar-perfil-page',
  standalone: true,
  imports: [CommonModule, PerfilAvatarComponent, PerfilFormularioComponent],
  templateUrl: './editar-perfil-page.html',
})
export class EditarPerfilPage implements OnInit {
  private location = inject(Location);
  private pacienteService = inject(PacienteService); // <-- Inyectamos tu PacienteService
  private keycloak = inject(KeycloakService);

  estadoGuardar: 'check' | 'pending' | 'done_all' = 'check';
  pacienteActual: any = {};
  cargandoDatos = true;

  // Para el avatar: Calculamos el nombre desde Keycloak
  public username = computed(() => {
    const profile = this.keycloak.getKeycloakInstance().profile;
    return profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario';
  });

  async ngOnInit() {
    // 1. Asegurarnos de que el perfil de Keycloak esté cargado
    await this.keycloak.loadUserProfile();

    // 2. Cargamos los datos básicos que Keycloak ya tiene
    this.cargarDatosDeKeycloak();

    // 3. Vamos al backend de NestJS a buscar el resto de la info
    this.cargarDatosDelBackend();
  }

  cargarDatosDeKeycloak() {
    const profile = this.keycloak.getKeycloakInstance().profile;

    if (profile) {
      this.pacienteActual.nombres = profile.firstName;
      this.pacienteActual.apellidos = profile.lastName;
      this.pacienteActual.email = profile.email;
      this.pacienteActual.username = profile.username;
      this.pacienteActual.documento = profile.username; // Asumimos que el username es el documento
    }
  }

  cargarDatosDelBackend() {
    // Tomamos el username (documento) de Keycloak para buscar en la BD
    const idPaciente = this.keycloak.getKeycloakInstance().profile?.username;

    if (!idPaciente) return;

    this.pacienteService.getPaciente(idPaciente).subscribe({
      next: (datosBackend) => {
        // Mezclamos los datos del backend con los que ya teníamos
        // (Usamos los del backend si existen, si no, mantenemos los de Keycloak)
        this.pacienteActual = {
          ...this.pacienteActual,
          ...datosBackend,
        };
        this.cargandoDatos = false;
      },
      error: (err) => {
        console.error('El paciente no tiene datos extra en la BD o no se encontró', err);
        this.cargandoDatos = false;
      },
    });
  }

  volver() {
    this.location.back();
  }

  guardarCambios() {
    this.estadoGuardar = 'pending';

    // OJO: Aquí más adelante tendrías que llamar a un método "actualizarPaciente" en tu servicio
    setTimeout(() => {
      console.log('Guardando...', this.pacienteActual);
      this.estadoGuardar = 'done_all';
      setTimeout(() => (this.estadoGuardar = 'check'), 2000);
    }, 800);
  }

  eliminarCuenta() {
    // ...
  }
}
