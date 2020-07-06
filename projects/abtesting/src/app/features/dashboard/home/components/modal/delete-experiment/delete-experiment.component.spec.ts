import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteExperimentComponent } from './delete-experiment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

describe('DeleteExperimentComponent', () => {
  let component: DeleteExperimentComponent;
  let fixture: ComponentFixture<DeleteExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteExperimentComponent ],
      imports: [TestingModule],
      providers: [
        ExperimentService,
        { provide: MatDialogRef, useValue: {} },
	      { provide: MAT_DIALOG_DATA, useValue: [] },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
