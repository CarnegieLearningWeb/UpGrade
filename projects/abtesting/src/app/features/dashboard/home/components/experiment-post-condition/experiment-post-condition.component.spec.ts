import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentPostConditionComponent } from './experiment-post-condition.component';

describe('ExperimentPostConditionComponent', () => {
  let component: ExperimentPostConditionComponent;
  let fixture: ComponentFixture<ExperimentPostConditionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentPostConditionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentPostConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
