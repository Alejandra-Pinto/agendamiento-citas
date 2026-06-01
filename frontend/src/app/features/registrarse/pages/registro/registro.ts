import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../../core/services/paciente.service';
import { BrandingSide } from '../../components/branding-side/branding-side';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

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
  exitoMensaje: string | null = null;
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
      // 1. Añadimos el validador asíncrono como tercer parámetro del control
      documento: [
        '', 
        [Validators.required, Validators.pattern('^[0-9]{7,11}$')],
        [this.documentoDuplicadoValidator()] 
      ],
      nombres: ['', [
        Validators.required,
        Validators.pattern(this.letrasPattern),
        Validators.minLength(2),
        Validators.maxLength(20)
      ]],
      apellidos: ['', [
        Validators.required,
        Validators.pattern(this.letrasPattern),
        Validators.minLength(2),
        Validators.maxLength(20)
      ]],
      email: ['', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      generoP: ['MASCULINO', [Validators.required]],
      password: ['', [Validators.minLength(6)]], 
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
      this.registroForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.registroForm.get('confirmarPassword')?.setValidators([Validators.required]);
    }
    this.registroForm.updateValueAndValidity();
  }

  documentoDuplicadoValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.hasError('pattern')) {
        return of(null); // Si está vacío o no cumple con el formato básico de números, no dispara la consulta HTTP
      }

      return timer(500).pipe(
        switchMap(() => this.pacienteService.getPaciente(control.value).pipe(
          map(paciente => {
            // Si el backend retorna un paciente (encontrado), significa que ya existe. Marcamos el error.
            return paciente ? { documentoExiste: true } : null;
          }),
          catchError(() => {
            // Si el backend responde un error 404 (No encontrado), significa que el documento está libre y es válido
            return of(null);
          })
        ))
      );
    };
  }

  passwordMatchValidator(g: FormGroup) {
    if (this?.modoAdministrativo) return null;

    const pass = g.get('password')?.value;
    const confirm = g.get('confirmarPassword')?.value;

    return pass === confirm ? null : { mismatch: true };
  }

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

  private formatearTexto(texto: string): string {
    if (!texto) return '';
    let textoSinTildes = this.removerTildesMantenerEnie(texto);
    return textoSinTildes
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/(^\w|\s\w|ñ)/g, (m) => m.toUpperCase());
  }

  // Helper de errores para renderizar el nuevo error asíncrono
  getFieldError(field: string): string {
    const control = this.registroForm.get(field);
    if (!control) return '';

    // Si tiene el error de documento duplicado, lo mostramos de inmediato si el campo ya se modificó (dirty)
    if (control.hasError('documentoExiste') && control.dirty) {
      return 'Este documento ya se encuentra registrado';
    }

    // Para el resto de errores estándar de formato / obligatoriedad
    if (!control.touched && !control.dirty) return '';

    if (control.hasError('required')) return 'Este campo es obligatorio';

    if (control.hasError('pattern')) {
      if (field === 'documento') return 'Use solo números (7-11 dígitos)';
      if (field === 'celular') return 'Deben ser 10 números';
      if (field === 'email') return 'Formato inválido (ej@correo.com)';
      if (field === 'nombres' || field === 'apellidos') return 'Este campo no permite números ni símbolos';
    }
  
    if (control.hasError('minlength')) {
      if (field === 'password') return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
      if(field === 'nombres' || field === 'apellidos') return `Debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }

    if (control.hasError('maxlength')) {
      return `No puede superar ${control.errors?.['maxlength'].requiredLength} caracteres`;
    }

    return '';
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.cargando = true;
      this.errorMensaje = null;
      this.exitoMensaje = null;

      const rawValues = { ...this.registroForm.value };

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
            this.exitoMensaje = `¡Paciente ${rawValues.nombres} registrado con éxito!`;
            
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
          const respuestaError = err.error?.message;
          this.errorMensaje = Array.isArray(respuestaError) 
            ? respuestaError[0] 
            : (respuestaError || 'Error inesperado en el servidor');
        }
      });
    } else {
      this.registroForm.markAllAsTouched();
    }
  }
}