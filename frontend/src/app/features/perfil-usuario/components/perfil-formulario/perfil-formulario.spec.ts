import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilFormulario } from './perfil-formulario';

describe('PerfilFormulario', () => {
  let component: PerfilFormulario;
  let fixture: ComponentFixture<PerfilFormulario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilFormulario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilFormulario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
