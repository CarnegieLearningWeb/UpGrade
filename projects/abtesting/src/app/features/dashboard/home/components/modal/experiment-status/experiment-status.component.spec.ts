import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentStatusComponent } from './experiment-status.component';

describe('ExperimentStatusComponent', () => {
  let component: ExperimentStatusComponent;
  let fixture: ComponentFixture<ExperimentStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
