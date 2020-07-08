import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentEndCriteriaComponent } from './experiment-end-criteria.component';

describe('ExperimentEndCriteriaComponent', () => {
  let component: ExperimentEndCriteriaComponent;
  let fixture: ComponentFixture<ExperimentEndCriteriaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentEndCriteriaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentEndCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
