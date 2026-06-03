import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-horario-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatInputModule, MatFormFieldModule, MatNativeDateModule],
  templateUrl: './horario-selector.html',
})
export class HorarioSelectorComponent {
  @Input() fecha: string = '';
  @Input() horaSeleccionada: string = '';
  @Input() horarios: any[] = [];

  @Input() filtroFechas: (d: Date | null) => boolean = () => true;

  @Output() fechaChange = new EventEmitter<string>();
  @Output() horaChange = new EventEmitter<string>();


  onFechaChange(event: any) {
    if (event.value) {
      const fecha = event.value as Date;

      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');

      const fechaSeleccionada = `${year}-${month}-${day}`;

      this.fechaChange.emit(fechaSeleccionada);
    }
  }

  onHoraChange(nuevaHora: string) {
    this.horaChange.emit(nuevaHora);
  }

  ngOnChanges() {
    console.log('fecha input:', this.fecha);
  }

  convertirHora(hora: string): string {
    // Convierte "08:15 AM" → "08:15"
    const [time, modifier] = hora.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
}
