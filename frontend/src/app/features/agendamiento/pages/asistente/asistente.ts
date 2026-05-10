import { Component, signal, inject, OnInit, computed, Signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { CitasService } from '../../../../core/services/citas-service';
import { EspecialistaService } from '../../../../core/services/especialista.service';
import { EspecialistaSelectorComponent } from '../../componentes/especialista-selector/especialista-selector';
import { HorarioSelectorComponent } from '../../componentes/horario-selector/horario-selector';
import { FormActionsComponent } from '../../componentes/form-actions/form-actions';
import { Cita } from '../../../../core/models/cita.model';
import { AdminService } from '../../../../core/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    EspecialistaSelectorComponent,
    HorarioSelectorComponent,
    FormActionsComponent,
  ],
  templateUrl: './asistente.html',
  styleUrl: './asistente.scss',
})
export class AsistenteComponent implements OnInit {
  public authService = inject(AuthStateService);
  private citasService = inject(CitasService);
  private especialistaService = inject(EspecialistaService);
  private adminService = inject(AdminService);

  // Signals de estado
  especialistas = signal<any[]>([]);
  especialidadElegida = signal<string>('');
  doctorSeleccionado = signal<any>(null);
  fechaSeleccionada = signal<string>('');
  horaSeleccionada = signal<string>('');
  tipoCita = signal<string>('');

  configuracionGlobal = signal<any>(null);
  agendaDoctorActual = signal<any>(null);

  historialCargado = signal<boolean>(false);
  citasPasadas = signal<any[]>([]);
  citasFuturas = signal<any[]>([]);
  horarios = signal<any[]>([]);

  minDate: string = new Date().toISOString().split('T')[0];
  intentoEnvio: boolean = false;

  ngOnInit() {
    this.cargarEspecialistas();
    this.cargarConfiguracionGlobal();

    effect(() => {
      const usuario = this.authService.usuario();
      const especialistas = this.especialistas();

      if (!this.historialCargado() && usuario?.username && especialistas.length > 0) {
        this.cargarHistorialPaciente();
        this.historialCargado.set(true);
      }
    });
  }

  cargarEspecialistas() {
    this.especialistaService.listarEspecialistas().subscribe((data) => {
      this.especialistas.set(data);
      this.cargarHistorialPaciente(); // Cargamos el historial después de tener la lista de especialistas 
    });
  }

  cargarHistorialPaciente() {
    const usuario = this.authService.usuario();
    if (usuario?.username) {
      this.citasService.obtenerCitasPorPaciente(usuario.username).subscribe({
        next: (res: any[]) => {
          const ahora = new Date();

          // 1. Obtenemos la lista actual de especialistas para saber quién es quién
          const listaEspecialistas = this.especialistas();

          const procesadas = res.map((c) => {
            // 2. Buscamos al doctor en nuestra lista local usando su ID
            const doctorEncontrado = listaEspecialistas.find(
              (e) => e.id.toString() === c.especialistaId.toString(),
            );

            // 3. Si lo encontramos, sacamos su especialidad. Si no, ponemos 'General'
            const especialidadTexto = doctorEncontrado
              ? doctorEncontrado.especialidad.replace(/_/g, ' ')
              : 'Médica';

            return {
              ...c,
              especialistaNombre:
                c.especialista?.nombre ||
                (c.especialista?.nombres
                  ? `${c.especialista.nombres} ${c.especialista.apellidos}`
                  : 'Médico no asignado'),
              // Inyectamos la especialidad solo para la vista
              notas: especialidadTexto,
            } as any;
          });

          const ordenadas = procesadas.sort(
            (a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
          );
          this.citasFuturas.set(ordenadas.filter((c) => new Date(c.fechaHora) >= ahora));
          this.citasPasadas.set(ordenadas.filter((c) => new Date(c.fechaHora) < ahora).reverse());
        },
      });
    }
  }

  cargarConfiguracionGlobal() {
    this.adminService.obtenerConfiguracionGlobal().subscribe({
      next: (conf) => this.configuracionGlobal.set(conf),
      error: () => console.error('No se pudo cargar la config global')
    });
  }

  // Función auxiliar para evitar errores de tipos en el estado
  private validarEstado(estado: string): any {
    const validos = ['PROGRAMADA', 'CANCELADA', 'REAGENDADA', 'FINALIZADA'];
    return validos.includes(estado) ? estado : 'PROGRAMADA';
  }

  // Filtrado de doctores según la especialidad seleccionada
  doctoresFiltrados = computed(() => {
    const esp = this.especialidadElegida();
    const todos = this.especialistas();

    // Si no hay especialidad o es 'GENERAL', mostramos todos los doctores
    const filtrados = (!esp || esp === 'GENERAL') 
      ? todos 
      : todos.filter((d) => d.especialidad === esp);

    return filtrados.map((doc) => ({
      ...doc,
      nombreMostrar: doc.nombre || `${doc.nombres} ${doc.apellidos}`,
      especialidadLabel: doc.especialidad.replace(/_/g, ' ').toLowerCase(),
    }));
  });

  // Manejadores de eventos del HTML
  onEspecialidadChange(event: any) {
    this.especialidadElegida.set(event.target.value);
    this.doctorSeleccionado.set(null);
    this.horarios.set([]);
  }

  seleccionarDoctor(data: any) {
    if (!data) return;

    const idBuscado = typeof data === 'object' ? data.id : data;
    const doctorReal = this.especialistas().find((d) => String(d.id) === String(idBuscado));

    if (doctorReal) {
      this.doctorSeleccionado.set({
        ...doctorReal,
        // Si ya tiene 'nombre' (como la Dra. Ibis), lo usamos.
        // Si no, unimos nombres y apellidos.
        nombreMostrar:
          doctorReal.nombre || `${doctorReal.nombres || ''} ${doctorReal.apellidos || ''}`.trim(),
      });

      // Cargamos la agenda del doctor para mostrarla en el calendario
      this.adminService.obtenerAgendaEspecialista(String(doctorReal.id)).subscribe({
        next: (agenda) => {
          this.agendaDoctorActual.set(agenda);
          this.horaSeleccionada.set(''); // Limpiamos la hora seleccionada al cambiar de doctor
          this.cargarDisponibilidad(); // Recargamos la disponibilidad con la nueva agenda
        },
        error: () => this.agendaDoctorActual.set(null),
      });
    }

    this.horaSeleccionada.set('');
    this.cargarDisponibilidad();
  }

  onFechaChange(fecha: string) {
    this.fechaSeleccionada.set(fecha);
    this.horaSeleccionada.set('');
    this.cargarDisponibilidad();
  }

  // Lógica de carga de horarios (Sincronizada con Signals)
  cargarDisponibilidad() {
    const doctor = this.doctorSeleccionado();
    const fecha = this.fechaSeleccionada();

    // Si no hay doctor, no intentamos llamar al servicio
    if (!doctor || !doctor.id || !fecha) return;

    this.citasService.getDisponibilidad(String(doctor.id), fecha).subscribe({
      next: (res) => this.horarios.set(res || []),
      error: () => this.horarios.set([]),
    });
  }

  doctorResumen = computed(() => {
    const seleccionado = this.doctorSeleccionado();
    return seleccionado ? seleccionado : null;
  });

  private generarHorariosDesdeConfiguracion(doctor: any): any[] {
    if (!doctor?.horarioAtencion) return [];

    const slots = [];
    const [hInicio, mInicio] = doctor.horarioAtencion.horaInicio.split(':').map(Number);
    const [hFin, mFin] = doctor.horarioAtencion.horaFin.split(':').map(Number);
    const intervalo = doctor.intervaloAtencion || 20;

    let actual = hInicio * 60 + mInicio;
    const fin = hFin * 60 + mFin;

    while (actual < fin) {
      const hh = Math.floor(actual / 60)
        .toString()
        .padStart(2, '0');
      const mm = (actual % 60).toString().padStart(2, '0');
      slots.push({ hora: `${hh}:${mm}` });
      actual += intervalo;
    }
    return slots;
  }

  confirmarCita() {
    const perfil = this.authService.usuario();
    const doc = this.doctorSeleccionado();
    const fecha = this.fechaSeleccionada();
    const hora = this.horaSeleccionada();
    const especialidad = this.especialidadElegida();

    if (!perfil?.username || !doc || !fecha || !hora || !this.tipoCita()) {
      const mensaje = !this.tipoCita()
        ? 'Selecciona si la cita es Primera Vez o Control antes de confirmar.'
        : 'Completa todos los campos antes de confirmar';
      this.mostrarNotificacion(mensaje, 'warning');
      return;
    }

    // DIVISIÓN SEGURA: Nos aseguramos de que horas y minutos siempre tengan 2 dígitos
    const partes = hora.split(':');
    const h = partes[0].padStart(2, '0');
    const m = (partes[1] || '00').padEnd(2, '0'); // Si no hay minutos, ponemos '00'

    const fechaHoraStr = `${fecha}T${h}:${m}:00`;

    const dto = {
      pacienteId: perfil.username,
      especialistaId: doc.id.toString(),
      fechaHora: fechaHoraStr,
      tipo: this.tipoCita() || 'CONTROL',
    };

    Swal.fire({ title: 'Procesando cita...', didOpen: () => Swal.showLoading() });

    this.citasService.crearCita(dto).subscribe({
      next: () => {
        const nombreDoc = doc.nombreMostrar || doc.nombre || `${doc.nombres} ${doc.apellidos}`;
        Swal.fire({
          icon: 'success',
          title: '¡Cita Agendada!',
          text: `Tu cita con el Dr(a). ${nombreDoc} ha sido registrada.`,
          confirmButtonColor: '#3b82f6',
        });
        this.cargarHistorialPaciente();
        this.limpiarFormulario();
      },
      error: (err) => {
        const msg = Array.isArray(err.error?.message)
          ? err.error.message.join('. ')
          : err.error?.message || 'Error de conexión';
        const esFechaPasada = msg.toLowerCase().includes('pasado');
        const esAdvertencia =
          msg.toLowerCase().includes('atiende') || msg.toLowerCase().includes('ventana');

        Swal.fire({
          icon: esFechaPasada ? 'error' : esAdvertencia ? 'warning' : 'error',
          title: esFechaPasada ? 'Fecha Inválida' : esAdvertencia ? 'Atención' : 'Error',
          text: msg,
          confirmButtonColor: esFechaPasada ? '#ef4444' : '#3b82f6',
        });
      },
    });
  }

  cancelar() {
    Swal.fire({
      title: '¿Limpiar formulario?',
      text: 'Se perderán los datos de la cita actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'No, continuar',
    }).then((result) => {
      if (result.isConfirmed) this.limpiarFormulario();
    });
  }

  limpiarFormulario() {
    this.especialidadElegida.set('');
    this.doctorSeleccionado.set(null);
    this.tipoCita.set('');
    this.fechaSeleccionada.set('');
    this.horaSeleccionada.set('');
    this.horarios.set([]);
    this.agendaDoctorActual.set(null);
    this.intentoEnvio = false;
  }


  private festivosColombia = [
    '2026-01-01', '2026-01-06', '2026-03-23', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
    '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08', '2026-12-25'
  ];

  filtroCalendario = (d: Date | null): boolean => {
    if (!d) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Bloqueo Pasado
    if (d < hoy) return false;

    // Bloqueo Ventana de Semanas (Usando el Signal configuracionGlobal)
    const config = this.configuracionGlobal();
    if (config?.ventanaHabilitacionSemanas) {
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() + (config.ventanaHabilitacionSemanas * 7));
      if (d > fechaLimite) return false;
    }

    // Bloqueo Festivos
    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    const stringFechaLocal = `${anio}-${mes}-${dia}`;
    if (this.festivosColombia.includes(stringFechaLocal)) return false;

    // Bloqueo Agenda del Especialista
    return this.validarDiaEspecialista(d);
  };

  private validarDiaEspecialista(fecha: Date): boolean {
    const agenda = this.agendaDoctorActual(); // Usamos el Signal de la agenda
    if (!agenda || !agenda.horarioAtencion?.diaSemana) return true;

    const diasMapa: { [key: number]: string } = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };

    const diaNombreActual = diasMapa[fecha.getDay()];
    const diasConfigurados = agenda.horarioAtencion.diaSemana.map((d: string) =>
      d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    return diasConfigurados.includes(diaNombreActual);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'error' | 'warning' = 'error') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: tipo,
      title: mensaje,
      showConfirmButton: false,
      timer: 3000,
    });
  }
}
