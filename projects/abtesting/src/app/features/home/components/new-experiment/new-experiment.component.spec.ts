import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewExperimentComponent } from './new-experiment.component';

describe('NewExperimentComponent', () => {
  let component: NewExperimentComponent;
  let fixture: ComponentFixture<NewExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewExperimentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
