import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentScheduleComponent } from './experiment-schedule.component';

describe('ExperimentScheduleComponent', () => {
  let component: ExperimentScheduleComponent;
  let fixture: ComponentFixture<ExperimentScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
