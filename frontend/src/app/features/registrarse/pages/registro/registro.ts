import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core'; // Usamos signals para el ojo
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../../core/services/paciente.service';
import { BrandingSide } from '../../components/branding-side/branding-side';
import { AuthStateService } from '../../../../core/services/auth-state.service';
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BrandingSide, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class RegistroPage implements OnInit {
  @Input() modoAdministrativo: boolean = false; // Para diferenciar entre registro normal y desde admin
  @Output() pacienteRegistrado = new EventEmitter<any>();

  registroForm: FormGroup;
  errorMensaje: string | null = null;
  cargando = false;

  // Signals para mostrar/ocultar contraseñas
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Inyectamos el servicio correctamente
  public authService = inject(AuthStateService);

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      documento: ['', [Validators.required, Validators.pattern('^[0-9]{7,11}$')]],
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      generoP: ['MASCULINO', [Validators.required]],
      password: ['', [Validators.minLength(8)]],
      confirmarPassword: [''], // Quitamos Validators.required de aquí, se pone en ngOnInit
      terminos: [true]
    }, {
      // USAMOS FUNCIÓN DE FLECHA AQUÍ PARA NO PERDER EL CONTEXTO
      validators: (g: FormGroup) => this.passwordMatchValidator(g)
    });
  }

  ngOnInit() {
    // Si es administrativo, las contraseñas no son obligatorias en el formulario
    if (this.modoAdministrativo) {
      this.registroForm.get('password')?.clearValidators();
      this.registroForm.get('confirmarPassword')?.clearValidators();
    } else {
      // Si es público, sí son obligatorias
      this.registroForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.registroForm.get('confirmarPassword')?.setValidators([Validators.required]);
    }
    this.registroForm.updateValueAndValidity();
  }

  passwordMatchValidator(g: FormGroup) {
    // El chequeo 'this?.modoAdministrativo' evita el error de undefined
    if (this?.modoAdministrativo) return null;

    const pass = g.get('password')?.value;
    const confirm = g.get('confirmarPassword')?.value;

    return pass === confirm ? null : { mismatch: true };
  }

  // Helper para mostrar errores en el HTML
  getFieldError(field: string): string {
    const control = this.registroForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('pattern')) {
      if (field === 'documento') return 'Use solo números (7-11 dígitos)';
      if (field === 'celular') return 'Deben ser 10 números';
      if (field === 'email') return 'Formato inválido (ej@correo.com)';
    }
    if (control.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;

    return '';
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.cargando = true;
      const rawValues = { ...this.registroForm.value };

      if (this.modoAdministrativo) {
        rawValues.password = rawValues.documento;
      }

      delete rawValues.confirmarPassword;
      delete rawValues.terminos;

      this.pacienteService.crearPaciente(rawValues).subscribe({
        next: (pacienteCreado) => {
          this.cargando = false;
          
          if (!this.modoAdministrativo) {
            // Flujo público normal
            this.router.navigate(['/login']);
          } else {
            // FLUJO ADMINISTRATIVO: Avisamos al componente padre enviando los datos
            
            const datosPaciente = pacienteCreado || {
              nombres: rawValues.nombres,
              apellidos: rawValues.apellidos,
              documento: rawValues.documento
            };
            
            this.pacienteRegistrado.emit(datosPaciente);
            this.registroForm.reset({ generoP: 'MASCULINO' }); // Limpiamos el formulario para la próxima
          }
        },
        error: (err) => {
          this.cargando = false;
          this.errorMensaje = err.error?.message || 'Error en el servidor';
        }
      });
    } else {
      this.registroForm.markAllAsTouched();
    }
  }
}