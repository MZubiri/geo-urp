import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosEntrevista } from './turnos-entrevista';

describe('TurnosEntrevista', () => {
  let component: TurnosEntrevista;
  let fixture: ComponentFixture<TurnosEntrevista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosEntrevista],
    }).compileComponents();

    fixture = TestBed.createComponent(TurnosEntrevista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
