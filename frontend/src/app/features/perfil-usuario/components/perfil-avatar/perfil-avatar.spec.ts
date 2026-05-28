import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilAvatar } from './perfil-avatar';

describe('PerfilAvatar', () => {
  let component: PerfilAvatar;
  let fixture: ComponentFixture<PerfilAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAvatar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilAvatar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
