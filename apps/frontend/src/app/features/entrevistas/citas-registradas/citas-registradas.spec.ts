import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitasRegistradas } from './citas-registradas';

describe('CitasRegistradas', () => {
  let component: CitasRegistradas;
  let fixture: ComponentFixture<CitasRegistradas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitasRegistradas],
    }).compileComponents();

    fixture = TestBed.createComponent(CitasRegistradas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
