import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { PerfilAvatarComponent } from '../../components/perfil-avatar/perfil-avatar';
import { PerfilFormularioComponent } from '../../components/perfil-formulario/perfil-formulario';

@Component({
  selector: 'app-editar-perfil-page',
  standalone: true,
  imports: [CommonModule, PerfilAvatarComponent, PerfilFormularioComponent],
  templateUrl: './editar-perfil-page.html',
})
export class EditarPerfilPage implements OnInit {
  // Estado visual del botón de guardar
  estadoGuardar: 'check' | 'pending' | 'done_all' = 'check';

  // Datos simulados
  pacienteActual = {
    nombres: 'Alejandro',
    apellidos: 'Rodríguez',
    username: 'alex_rod88',
    documento: '1029384756',
    celular: '+52 55 1234 5678',
    email: 'alejandro.rod@email.com',
    genero: 'Masculino',
    nacimiento: '12/05/1988',
    fotoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAk3lHVlSQVh7ijIONSEKhe2_I5Wwhpc7KUKRD3kN8Zs9FnXQjWBtJg8iDwRN9KbeIxRRPHkNcTnWZlto25CWzuFip6_3ZBbRgnA4oSy0Li7BaDy4pIeI6pZ_0HzgVgKwLXRvwstWce6oPelAoLk-ZAAkndUxo8Ul8UEHfvwOJGH7F2VSftHPVjtnqagfJYLEM2vcIleROaigMND7p-T4aa1vELVEzf7hs4PnIiOtdy_cuO1ZQjKioYpPGoYfItnok_kAM00OpUYHs',
  };

  constructor(private location: Location) {}

  ngOnInit(): void {}

  volver() {
    this.location.back();
  }

  procesarCambioFoto() {
    console.log('Abrir selector de archivos o cámara');
    // Lógica para subir foto
  }

  guardarCambios() {
    this.estadoGuardar = 'pending';

    // Simulamos la petición al backend (Facade)
    setTimeout(() => {
      console.log('Datos a guardar:', this.pacienteActual);
      this.estadoGuardar = 'done_all';

      setTimeout(() => {
        this.estadoGuardar = 'check';
      }, 2000);
    }, 800);
  }

  eliminarCuenta() {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      console.log('Cuenta eliminada');
    }
  }
}
