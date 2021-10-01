import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentStatusComponent } from './experiment-status.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TestMockData } from '../../../../../../../testing/test.mock.data';

describe('ExperimentStatusComponent', () => {
  let component: ExperimentStatusComponent;
  let fixture: ComponentFixture<ExperimentStatusComponent>;

  const modalData = {
    experiment: TestMockData.getExperiment()[0]
  }
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentStatusComponent ],
      imports: [TestingModule, OwlDateTimeModule, OwlNativeDateTimeModule],
      providers: [
        ExperimentService,
        { provide: MatDialogRef, useValue: {} },
	      { provide: MAT_DIALOG_DATA, useValue: modalData },
      ]
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
