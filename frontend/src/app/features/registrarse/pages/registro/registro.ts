import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core'; 
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
  @Input() modoAdministrativo: boolean = false; 
  @Output() pacienteRegistrado = new EventEmitter<any>();

  registroForm: FormGroup;
  errorMensaje: string | null = null;
  cargando = false;

  // Signals para mostrar/ocultar contraseñas
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Expresión regular para validar solo letras (con tildes, diéresis y Ñ) y espacios
  private letrasPattern = '^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$';

  // Inyectamos el servicio correctamente
  public authService = inject(AuthStateService);

  constructor(
    private fb: FormBuilder,
    private pacienteService: PacienteService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      documento: ['', [Validators.required, Validators.pattern('^[0-9]{7,11}$')]],
      // Se añade el patrón de letras y el mínimo pasa a ser coherente
      nombres: ['', [Validators.required, Validators.pattern(this.letrasPattern)]],
      apellidos: ['', [Validators.required, Validators.pattern(this.letrasPattern)]],
      email: ['', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      generoP: ['MASCULINO', [Validators.required]],
      password: ['', [Validators.minLength(6)]], // Ajustado de 8 a 6 caracteres
      confirmarPassword: [''], 
      terminos: [true]
    }, {
      validators: (g: FormGroup) => this.passwordMatchValidator(g)
    });
  }

  ngOnInit() {
    if (this.modoAdministrativo) {
      this.registroForm.get('password')?.clearValidators();
      this.registroForm.get('confirmarPassword')?.clearValidators();
    } else {
      // Ajustado a minLength(6) para el entorno público
      this.registroForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.registroForm.get('confirmarPassword')?.setValidators([Validators.required]);
    }
    this.registroForm.updateValueAndValidity();
  }

  passwordMatchValidator(g: FormGroup) {
    if (this?.modoAdministrativo) return null;

    const pass = g.get('password')?.value;
    const confirm = g.get('confirmarPassword')?.value;

    return pass === confirm ? null : { mismatch: true };
  }

  // Helper específico para remover tildes y diéresis protegiendo la Ñ / ñ
  private removerTildesMantenerEnie(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/(?<![nN])[\u0300-\u036f]/g, "")
      .replace(/[áäàâ]/g, 'a')
      .replace(/[éëèê]/g, 'e')
      .replace(/[íïìî]/g, 'i')
      .replace(/[óöòô]/g, 'o')
      .replace(/[úüùû]/g, 'u')
      .replace(/[ÁÄÀÂ]/g, 'A')
      .replace(/[ÉËÈÊ]/g, 'E')
      .replace(/[ÍÏÌÎ]/g, 'I')
      .replace(/[ÓÖÒÔ]/g, 'O')
      .replace(/[ÚÜÙÛ]/g, 'U');
  }

  // Helper para limpiar espacios, remover acentos y capitalizar (Primera Letra Mayúscula)
  private formatearTexto(texto: string): string {
    if (!texto) return '';
    
    // Primero removemos las tildes de forma segura
    let textoSinTildes = this.removerTildesMantenerEnie(texto);

    // Mantiene tu misma lógica de formateo y capitalización sobre la cadena limpia
    return textoSinTildes
      .trim()                                      // Quita espacios al inicio y al final
      .replace(/\s+/g, ' ')                        // Une múltiples espacios intermedios en uno solo
      .toLowerCase()                               // Convierte todo a minúsculas provisionalmente
      .replace(/(^\w|\s\w|ñ)/g, (m) => m.toUpperCase()); // Capitaliza la primera letra de cada palabra
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
      if (field === 'nombres' || field === 'apellidos') return 'Este campo no permite números ni símbolos';
    }
    
    if (control.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }

    return '';
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.cargando = true;
      const rawValues = { ...this.registroForm.value };

      // Aplicamos la limpieza y formateo a los nombres y apellidos antes de enviar al backend
      rawValues.nombres = this.formatearTexto(rawValues.nombres);
      rawValues.apellidos = this.formatearTexto(rawValues.apellidos);

      if (this.modoAdministrativo) {
        rawValues.password = rawValues.documento;
      }

      delete rawValues.confirmarPassword;
      delete rawValues.terminos;

      this.pacienteService.crearPaciente(rawValues).subscribe({
        next: (pacienteCreado) => {
          this.cargando = false;
          
          if (!this.modoAdministrativo) {
            this.router.navigate(['/login']);
          } else {
            const datosPaciente = pacienteCreado || {
              nombres: rawValues.nombres,
              apellidos: rawValues.apellidos,
              documento: rawValues.documento
            };
            
            this.pacienteRegistrado.emit(datosPaciente);
            this.registroForm.reset({ generoP: 'MASCULINO' }); 
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