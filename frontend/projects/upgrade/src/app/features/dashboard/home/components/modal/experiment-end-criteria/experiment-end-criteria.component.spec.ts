import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentEndCriteriaComponent } from './experiment-end-criteria.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { OwlNativeDateTimeModule, OwlDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { TestMockData } from '../../../../../../../testing/test.mock.data';

xdescribe('ExperimentEndCriteriaComponent', () => {
  let component: ExperimentEndCriteriaComponent;
  let fixture: ComponentFixture<ExperimentEndCriteriaComponent>;

  const modalData = {
    experiment: TestMockData.getExperiment()[0],
  };
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentEndCriteriaComponent],
      imports: [TestingModule, OwlDateTimeModule, OwlNativeDateTimeModule],
      providers: [
        ExperimentService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: modalData },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentEndCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
