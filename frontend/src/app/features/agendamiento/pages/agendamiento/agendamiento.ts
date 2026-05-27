import { Component, OnInit } from '@angular/core';
import { CitasService } from '../../../../core/services/citas-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PacienteResumenComponent } from '../../componentes/paciente-resumen-component/paciente-resumen-component';
import { EspecialistaSelectorComponent } from '../../componentes/especialista-selector/especialista-selector';
import { EspecialistaService } from '../../../../core/services/especialista.service';
import { HorarioSelectorComponent } from '../../componentes/horario-selector/horario-selector';
import { FormActionsComponent } from '../../componentes/form-actions/form-actions';
import Swal from 'sweetalert2';
import { NgModel } from '@angular/forms';
import { DisponibilidadDoctores } from '../../componentes/disponibilidad-doctores/disponibilidad-doctores';
import { PacienteService } from '../../../../core/services/paciente.service';
import { AdminService } from '../../../../core/services/admin.service';
import { RegistroPage } from "../../../registrarse/pages/registro/registro";

@Component({
  selector: 'app-agendamiento',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    PacienteResumenComponent,
    EspecialistaSelectorComponent,
    HorarioSelectorComponent,
    FormActionsComponent,
    DisponibilidadDoctores,
    RegistroPage
],
  templateUrl: './agendamiento.html',
  styleUrl: './agendamiento.scss',
})
export class Agendamiento implements OnInit {
  especialistas: any[] = [];
  horarios: any[] = [];
  intentoEnvio: boolean = false;
  pacienteEncontrado: any = null;

  formData = {
    cedula: '',
    nombre: '',
    especialistaid: '',
    fecha: '',
    hora: '',
    tipo: '',
  };

  // Agrega una variable para guardar el límite
  ventanaSemanas: number = 4; // Valor por defecto

  // Propiedad para abrir/cerrar el modal flotante
  mostrarModalRegistro = false;

  constructor(
    private citasService: CitasService,
    private especialistaService: EspecialistaService,
    private pacienteService: PacienteService,
    private adminService: AdminService
  ) {
    this.filtroCalendario = this.filtroCalendario.bind(this);
  }

  sugerencias: any[] = []; // Array para guardar los resultados temporales


  ngOnInit(): void {
    console.log('AGENDAMIENTO CARGADO');
    this.cargarEspecialistas();
    this.cargarConfiguracionGlobal();
  }

  
  onInputBusqueda(event: any) {
    const query = event.target.value.trim();
    
    if (query.length >= 3) {
      this.pacienteService.buscarSugerencias(query).subscribe({
        next: (data) => {       
          this.sugerencias = data ?? [];
        },
        error: (err) => {
          console.error('Error al buscar sugerencias:', err);
          this.sugerencias = [];
        }
      });
    } else {
      this.sugerencias = [];
    }
  }

  // Al seleccionar, llenamos ambos campos
  seleccionarPaciente(paciente: any) {
    this.formData.cedula = paciente.documento;
    this.formData.nombre = `${paciente.nombres} ${paciente.apellidos}`;
    this.pacienteEncontrado = paciente;
    this.sugerencias = [];
    this.cargarDisponibilidad();
  }

  cargarEspecialistas() {
    this.especialistaService.listarEspecialistas().subscribe((data) => {
      console.log('Datos recibidos del Back:', data);
      this.especialistas = data;
    });
  }

  cargarConfiguracionGlobal() {
    this.adminService.obtenerConfiguracionGlobal().subscribe({
      next: (config: any) => {
        if (config && config.ventanaHabilitacionSemanas) {
          this.ventanaSemanas = config.ventanaHabilitacionSemanas;
          console.log('Ventana de agendamiento:', this.ventanaSemanas, 'semanas');
        }
      }
    });
  }

  buscarPaciente() {
    const cedula = this.formData.cedula.trim();

    // 1. Si está vacío, no hacemos nada y reseteamos
    if (!cedula) {
      this.pacienteEncontrado = null;
      this.formData.nombre = '';
      return;
    }

    // 2. Llamada al servicio
    this.pacienteService.getPaciente(cedula).subscribe({
      next: (data) => {
        if (data) {
          // ¡Éxito! Guardamos los datos
          this.pacienteEncontrado = data;
          this.formData.nombre = `${data.nombres} ${data.apellidos}`;
          Swal.close();
        } else {
          // CASO: PACIENTE NO EXISTE
          this.manejarPacienteNoEncontrado();
        }
      },
      error: (err) => {
        console.error('Error de conexión:', err);
        this.mostrarNotificacion('Error de conexión con el servidor');
      },
    });
  }
  private manejarPacienteNoEncontrado() {
    this.pacienteEncontrado = null;
    this.formData.nombre = '';

    if (!Swal.isVisible()) {
      Swal.fire({
        icon: 'info',
        title: 'Paciente no registrado',
        text: `La cédula ${this.formData.cedula} no coincide con nuestra base de datos de Piedra Azul.`,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido',
      });
    }
  }
  limpiarFormulario() {
    // 1. Reseteamos la bandera de validación
    this.intentoEnvio = false;

    // 2. Limpiamos los datos como ya lo hacías
    this.formData = {
      cedula: '',
      nombre: '',
      especialistaid: '',
      fecha: '',
      hora: '',
      tipo: 'CONTROL',
    };
    this.pacienteEncontrado = null;
    this.horarios = [];

    console.log('Formulario reseteado y validaciones limpias.');
  }

  cargarDisponibilidad() {
    const { especialistaid, fecha } = this.formData;
    if (!especialistaid || !fecha) return;

    this.citasService.getDisponibilidad(especialistaid, fecha).subscribe({
      next: (data) => {
        // Si hay datos, usamos los del back (citas ocupadas filtradas, etc.)
        if (data && data.length > 0) {
          this.horarios = data;
        } else {
          // Si no hay datos (fecha pasada/no laborable), generamos su agenda real
          this.horarios = this.generarHorariosDesdeConfiguracion(especialistaid);
        }
      },
      error: () => {
        // Ante error de red, también mostramos su agenda base para no bloquear
        this.horarios = this.generarHorariosDesdeConfiguracion(especialistaid);
      },
    });
  }

  private generarHorariosDesdeConfiguracion(id: string): any[] {
    const doctor = this.especialistas.find((e) => e.id.toString() === id.toString());

    if (!doctor || !doctor.horarioAtencion) return [];

    const slots = [];
    // Asegúrate de que horaInicio y horaFin existan
    const { horaInicio, horaFin } = doctor.horarioAtencion;
    if (!horaInicio || !horaFin) return [];

    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    const intervalo = doctor.intervaloAtencion || 20;

    let actual = hInicio * 60 + mInicio;
    const fin = hFin * 60 + mFin;

    while (actual < fin) {
      const hh = Math.floor(actual / 60).toString().padStart(2, '0');
      const mm = (actual % 60).toString().padStart(2, '0');
      slots.push({ hora: `${hh}:${mm}` });
      actual += intervalo;
    }

    return slots;
  }

  manejarCambioEspecialista(id: number) {
    this.formData.especialistaid = id.toString();
    this.formData.fecha = ''; // Limpiamos fecha anterior para evitar inconsistencias
    this.horarios = [];

    // Re-asignamos la función para forzar al hijo a detectar un cambio de @Input
    this.filtroCalendario = this.filtroCalendario.bind(this);

    this.cargarDisponibilidad();
  }

  actualizarFecha(nuevaFecha: string) {
    this.formData.fecha = nuevaFecha;
    this.formData.hora = ''; // Resetear hora para obligar a elegir una del nuevo día
    this.cargarDisponibilidad();
  }

  get esFormularioInvalido(): boolean {
    return (
      !this.formData.cedula ||
      !this.formData.tipo ||
      !this.pacienteEncontrado ||
      !this.formData.especialistaid ||
      !this.formData.fecha ||
      !this.formData.hora
    );
  }

  agendar() {
    this.intentoEnvio = true;
    if (!this.validar()) return;

    const [horas, minutos] = this.formData.hora.split(':');
    const horaFormateada = `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}`;
    const fechaHoraStr = `${this.formData.fecha}T${horaFormateada}:00`;

    const dto = {
      pacienteId: this.formData.cedula,
      especialistaId: this.formData.especialistaid.toString(),
      fechaHora: fechaHoraStr,
      tipo: this.formData.tipo || 'CONTROL',
    };

    Swal.fire({
      title: 'Procesando cita...',
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.citasService.crearCita(dto).subscribe({
      next: () => {
        /* ... success ... */
        Swal.fire({
          icon: 'success',
          title: '¡Cita Agendada!',
          text: `La cita para ${this.formData.nombre} ha sido registrada con éxito.`,
          confirmButtonColor: '#3b82f6',
        });

        this.limpiarFormulario();
      },
      error: (err) => {
        const msg = Array.isArray(err.error?.message)
          ? err.error.message.join('. ')
          : err.error?.message || 'Error de conexión';

        // 1. Identificar si es error de "fecha pasada" (Rojito)
        const esFechaPasada = msg.toLowerCase().includes('pasado');

        // 2. Identificar si es advertencia de agenda (Naranja)
        // Por ejemplo: "No atiende los Jueves" o "Fuera de ventana"
        const esAdvertencia =
          msg.toLowerCase().includes('atiende') ||
          msg.toLowerCase().includes('ventana') ||
          msg.toLowerCase().includes('rango');

        Swal.fire({
          icon: esFechaPasada ? 'error' : esAdvertencia ? 'warning' : 'error',
          title: esFechaPasada ? 'Fecha Inválida' : esAdvertencia ? 'Atención' : 'Error',
          text: msg,
          confirmButtonColor: esFechaPasada ? '#ef4444' : esAdvertencia ? '#f59e0b' : '#ef4444',
        });
      },
    });
  }

  validar(): boolean {
    if (!this.formData.cedula) {
      this.mostrarNotificacion('La cédula es obligatoria', 'warning');
      return false;
    }
    if (!this.pacienteEncontrado) {
      this.mostrarNotificacion('Debe buscar un paciente válido', 'warning');
      return false;
    }
    if (!this.formData.especialistaid) {
      this.mostrarNotificacion('Seleccione un especialista', 'warning');
      return false;
    }
    if (!this.formData.fecha || !this.formData.hora) {
      this.mostrarNotificacion('Seleccione fecha y hora', 'warning');
      return false;
    }
    return true;
  }

  getEdad(): string {
    if (!this.pacienteEncontrado?.fechaNacimiento) return '--';

    const nacimiento = new Date(this.pacienteEncontrado.fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  }
  cancelar() {
    Swal.fire({
      title: '¿Limpiar formulario?',
      text: 'Se perderán todos los datos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'No, continuar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.limpiarFormulario();
      }
    });
  }

  private mostrarNotificacion(mensaje: string, tipo: 'error' | 'warning' = 'error') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: tipo,
      title: mensaje,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  formatearDiasAtencion(diasBrutos: any): string {
    // Cambiamos a any por si viene de un JSON inseguro
    if (!diasBrutos || !Array.isArray(diasBrutos)) return '';

    const normalizar = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const diasLimpios = [
      ...new Set(
        diasBrutos.map((dia: string) => {
          const base = normalizar(dia);
          if (base === 'miercoles') return 'Miércoles';
          return base.charAt(0).toUpperCase() + base.slice(1);
        }),
      ),
    ];
    return diasLimpios.join(', ');
  }

  festivosColombia = [
    '2026-01-01', '2026-01-06', '2026-03-23', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
    '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08', '2026-12-25'
  ];

  filtroCalendario = (d: Date | null): boolean => {
    if (!d) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // --- BLOQUEO 1: Pasado ---
    if (d < hoy) return false;

    // --- BLOQUEO 2: Ventana de Semanas (NUEVO) ---
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + (this.ventanaSemanas * 7));
    if (d > fechaLimite) return false;

    // --- BLOQUEO 3: Festivos ---
    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    const stringFechaLocal = `${anio}-${mes}-${dia}`;
    if (this.festivosColombia.includes(stringFechaLocal)) return false;

    // --- BLOQUEO 4: Agenda del Especialista ---
    return this.validarDiaEspecialista(d);
  };

  private validarDiaEspecialista(fecha: Date): boolean {
    const idEsp = this.formData.especialistaid;
    if (!idEsp) return false;

    const doctor = this.especialistas.find(e => e.id.toString() === idEsp.toString());

    if (!doctor || !doctor.horarioAtencion?.diaSemana) {
      console.warn('El doctor no tiene horario configurado:', doctor);
      return true;
    }

    const diasMapa: { [key: number]: string } = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };

    const diaNombreActual = diasMapa[fecha.getDay()];

    // Normalizamos usando 'diaSemana'
    const diasConfigurados = doctor.horarioAtencion.diaSemana.map((d: string) =>
      d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const esValido = diasConfigurados.includes(diaNombreActual);

    return esValido;
  }

  /**
   * Captura el evento emitido por el componente de registro rápido
   */
  manejarPacienteCreadoDesdeModal(paciente: any) {
    // 1. Cerramos el modal inmediatamente
    this.mostrarModalRegistro = false;

    // 2. Auto-rellenamos los datos en el modelo del formulario de agendamiento
    this.formData.cedula = paciente.documento;
    this.formData.nombre = `${paciente.nombres} ${paciente.apellidos}`;

    // 3. Vinculamos el objeto al componente de resumen de tarjeta lateral derecho
    this.pacienteEncontrado = paciente;

    // 4. Limpiamos cualquier residuo de la lista de sugerencias de búsqueda
    this.sugerencias = [];

    // 5. Desplegamos la confirmación visual e interactiva usando SweetAlert
    Swal.fire({
      icon: 'success',
      title: '¡Paciente Registrado!',
      text: `${paciente.nombres} ya está en la base de datos de Piedra Azul. Puede proceder a seleccionar el horario de la cita.`,
      confirmButtonColor: '#2563EB', // Color azul-600 de Tailwind
      timer: 3500,
      timerProgressBar: true
    });
  }
}
