import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentAnalysisComponent } from './experiment-analysis.component';

describe('ExperimentAnalysisComponent', () => {
  let component: ExperimentAnalysisComponent;
  let fixture: ComponentFixture<ExperimentAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
