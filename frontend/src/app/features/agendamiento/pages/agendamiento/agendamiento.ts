import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Importación tuya integrada
import { CitasService } from '../../../../core/services/citas-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PacienteResumenComponent } from '../../componentes/paciente-resumen-component/paciente-resumen-component';
import { EspecialistaSelectorComponent } from '../../componentes/especialista-selector/especialista-selector';
import { EspecialistaService } from '../../../../core/services/especialista.service';
import { HorarioSelectorComponent } from '../../componentes/horario-selector/horario-selector';
import { FormActionsComponent } from '../../componentes/form-actions/form-actions';
import Swal from 'sweetalert2';
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
  sugerencias: any[] = [];

  formData = {
    cedula: '',
    nombre: '',
    especialistaid: '',
    fecha: '',
    hora: '',
    tipo: 'CONTROL', // Mantiene tu valor por defecto para flujos post-consulta
  };

  ventanaSemanas: number = 4;
  mostrarModalRegistro = false; // Propiedad de tu amigo integrada

  constructor(
    private route: ActivatedRoute, // Inyección tuya integrada
    private citasService: CitasService,
    private especialistaService: EspecialistaService,
    private pacienteService: PacienteService,
    private adminService: AdminService
  ) {
    this.filtroCalendario = this.filtroCalendario.bind(this);
  }

  ngOnInit(): void {
    console.log('AGENDAMIENTO CARGADO');
    this.cargarEspecialistas();
    this.cargarConfiguracionGlobal();

    // Lógica tuya integrada: Captura automática desde la ficha médica externa
    this.route.queryParams.subscribe(params => {
      const pacienteId = params['pacienteId'];
      if (pacienteId) {
        this.formData.cedula = pacienteId;
        this.buscarPaciente();
      }
    });
  }

  // Helper privado para remover tildes y diacríticos de una cadena de texto
  eliminarTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

  onInputBusqueda(event: any) {
    const rawQuery = event.target.value;

    // 1. Limpieza base: minúsculas y sin tildes
    let queryLimpiado = this.eliminarTildes(rawQuery).toLowerCase();

    // Reemplazamos espacios múltiples intermedios por uno solo
    queryLimpiado = queryLimpiado.replace(/\s+/g, ' ');

    // 2. BLINDAJE DE CÉDULA: Creamos una versión sin ningún tipo de espacio para evaluar si es documento
    const querySinEspacios = queryLimpiado.replace(/\s/g, '');

    // Validación de longitud mínima (sobre la entrada real ignorando espacios huérfanos)
    if (queryLimpiado.trim().length < 3) {
      this.sugerencias = [];
      return;
    }

    // Determinar si la búsqueda apunta a una Cédula o a un Nombre
    const esNumerico = !isNaN(Number(querySinEspacios)) && querySinEspacios.length > 0;
    
    // ESTRATEGIA BACKEND: 
    // Si es cédula, mandamos la query sin espacios.
    const palabrasQuery = queryLimpiado.split(' ').filter(p => p.trim().length > 0);
    const queryParaBackend = esNumerico ? querySinEspacios : queryLimpiado.trim();

    this.pacienteService.buscarSugerencias(queryParaBackend).subscribe({
      next: (data) => {
        const resultados = data ?? [];

        this.sugerencias = resultados.filter((paciente: any) => {
          // Limpieza de datos del paciente de forma segura contra nulos
          const nombres = this.eliminarTildes(paciente.nombres ?? '').toLowerCase();
          const apellidos = this.eliminarTildes(paciente.apellidos ?? '').toLowerCase();
          const infoPacienteCompleto = `${nombres} ${apellidos}`.replace(/\s+/g, ' ').trim();
          
          // Limpieza del documento del paciente eliminando CUALQUIER espacio no deseado de la BD
          const cedulaPaciente = paciente.documento ? paciente.documento.toString().replace(/\s/g, '') : '';

          // Si el usuario buscaba un número, contrastamos contra la cédula limpia
          if (esNumerico) {
            return cedulaPaciente.includes(querySinEspacios);
          }

          // Si el usuario buscaba texto, aplicamos el filtro multi-palabra local en el Front
          return palabrasQuery.every(palabra =>
            infoPacienteCompleto.includes(palabra)
          );
        });
      },
      error: (err) => {
        console.error('Error al buscar sugerencias:', err);
        this.sugerencias = [];
      }
    });
  }

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

    if (!cedula) {
      this.pacienteEncontrado = null;
      this.formData.nombre = '';
      return;
    }

    this.pacienteService.getPaciente(cedula).subscribe({
      next: (data) => {
        if (data) {
          this.pacienteEncontrado = data;
          this.formData.nombre = `${data.nombres} ${data.apellidos}`;
          Swal.close();
          // Lógica tuya integrada: Carga disponibilidad inmediata si ya hay doctor pre-seleccionado
          this.cargarDisponibilidad();
        } else {
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
    this.intentoEnvio = false;
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
        if (data && data.length > 0) {
          this.horarios = data;
        } else {
          this.horarios = this.generarHorariosDesdeConfiguracion(especialistaid);
        }
      },
      error: () => {
        this.horarios = this.generarHorariosDesdeConfiguracion(especialistaid);
      },
    });
  }

  private generarHorariosDesdeConfiguracion(id: string): any[] {
    const doctor = this.especialistas.find((e) => e.id.toString() === id.toString());
    if (!doctor || !doctor.horarioAtencion) return [];

    const slots = [];
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
    this.formData.fecha = ''; 
    this.horarios = [];
    this.filtroCalendario = this.filtroCalendario.bind(this);
    this.cargarDisponibilidad();
  }

  actualizarFecha(nuevaFecha: string) {
    this.formData.fecha = nuevaFecha;
    this.formData.hora = ''; 
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

        const esFechaPasada = msg.toLowerCase().includes('pasado');
        
        // DETECCIÓN DE LA NUEVA REGLA DE NEGOCIO (Doble cita el mismo día)
        const esCitaDuplicadaDia = msg.toLowerCase().includes('ya cuenta con una cita');

        const esAdvertencia =
          esCitaDuplicadaDia || // <-- Integrada aquí para que use el color amarillo
          msg.toLowerCase().includes('atiende') ||
          msg.toLowerCase().includes('ventana') ||
          msg.toLowerCase().includes('rango');

        Swal.fire({
          icon: esFechaPasada ? 'error' : esAdvertencia ? 'warning' : 'error',
          title: esFechaPasada ? 'Fecha Inválida' : esCitaDuplicadaDia ? 'Paciente con Cita' : esAdvertencia ? 'Atención' : 'Error',
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
    if (!diasBrutos || !Array.isArray(diasBrutos)) return '';
    const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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

    if (d < hoy) return false;

    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + (this.ventanaSemanas * 7));
    if (d > fechaLimite) return false;

    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    const stringFechaLocal = `${anio}-${mes}-${dia}`;
    if (this.festivosColombia.includes(stringFechaLocal)) return false;

    return this.validarDiaEspecialista(d);
  };

  private validarDiaEspecialista(fecha: Date): boolean {
    const idEsp = this.formData.especialistaid;
    if (!idEsp) return false;

    const doctor = this.especialistas.find(e => e.id.toString() === idEsp.toString());
    if (!doctor || !doctor.horarioAtencion?.diaSemana) return true;

    const diasMapa: { [key: number]: string } = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };
    const diaNombreActual = diasMapa[fecha.getDay()];
    const diasConfigurados = doctor.horarioAtencion.diaSemana.map((d: string) =>
      d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    return diasConfigurados.includes(diaNombreActual);
  }

  // Lógica de tu amigo integrada: Captura el evento del componente modal
  manejarPacienteCreadoDesdeModal(paciente: any) {
    this.mostrarModalRegistro = false;
    this.formData.cedula = paciente.documento;
    this.formData.nombre = `${paciente.nombres} ${paciente.apellidos}`;
    this.pacienteEncontrado = paciente;
    this.sugerencias = [];

    Swal.fire({
      icon: 'success',
      title: '¡Paciente Registrado!',
      text: `${paciente.nombres} ya está en la base de datos de Piedra Azul. Puede proceder a seleccionar el horario de la cita.`,
      confirmButtonColor: '#2563EB',
      timer: 3500,
      timerProgressBar: true
    });
  }
  
}

