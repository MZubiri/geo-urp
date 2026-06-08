import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroCita } from './registro-cita';

describe('RegistroCita', () => {
  let component: RegistroCita;
  let fixture: ComponentFixture<RegistroCita>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroCita],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroCita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
