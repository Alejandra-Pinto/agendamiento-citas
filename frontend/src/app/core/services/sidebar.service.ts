import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Usamos Signals de Angular para un manejo de estado moderno, limpio y eficiente
  private _isSidebarOpen = signal<boolean>(false);
  
  public isSidebarOpen = this._isSidebarOpen.asReadonly();

  toggleSidebar() {
    this._isSidebarOpen.update(state => !state);
  }

  closeSidebar() {
    this._isSidebarOpen.set(false);
  }
}