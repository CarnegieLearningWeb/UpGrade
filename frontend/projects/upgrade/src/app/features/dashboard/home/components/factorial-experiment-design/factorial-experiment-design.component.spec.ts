import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorialExperimentDesignComponent } from './factorial-experiment-design.component';

xdescribe('FactorialExperimentDesignComponent', () => {
  let component: FactorialExperimentDesignComponent;
  let fixture: ComponentFixture<FactorialExperimentDesignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FactorialExperimentDesignComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FactorialExperimentDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
