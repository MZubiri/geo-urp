import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Miembros } from './miembros';

describe('Miembros', () => {
  let component: Miembros;
  let fixture: ComponentFixture<Miembros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Miembros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Miembros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
