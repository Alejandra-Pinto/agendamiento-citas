import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-avatar.html',
})
export class PerfilAvatarComponent {
  @Input() nombreUsuario: string = '';
}
