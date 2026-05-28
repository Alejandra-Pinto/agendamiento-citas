import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilNavbar } from './perfil-navbar';

describe('PerfilNavbar', () => {
  let component: PerfilNavbar;
  let fixture: ComponentFixture<PerfilNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
