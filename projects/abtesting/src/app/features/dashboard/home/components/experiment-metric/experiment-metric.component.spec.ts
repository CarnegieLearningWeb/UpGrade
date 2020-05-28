import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentMetricComponent } from './experiment-metric.component';

describe('ExperimentMetricComponent', () => {
  let component: ExperimentMetricComponent;
  let fixture: ComponentFixture<ExperimentMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentMetricComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
