import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewExperimentComponent } from './view-experiment.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { EnrollmentOverTimeComponent } from '../../components/enrollment-over-time/enrollment-over-time.component';
import { EnrollmentConditionTableComponent } from '../../components/enrollment-condition-table/enrollment-condition-table.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ExperimentQueryResultComponent } from '../../components/experiment-query-result/experiment-query-result.component';
import { TableRowComponent } from '../../components/table-row/table-row.component';
import { EnrollmentPointPartitionTableComponent } from '../../components/enrollment-point-partition-table/enrollment-point-partition-table.component';

xdescribe('ViewExperimentComponent', () => {
  let component: ViewExperimentComponent;
  let fixture: ComponentFixture<ViewExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ViewExperimentComponent,
        EnrollmentOverTimeComponent,
        EnrollmentConditionTableComponent,
        ExperimentQueryResultComponent,
        TableRowComponent,
        EnrollmentPointPartitionTableComponent,
      ],
      imports: [TestingModule, NgxChartsModule],
      providers: [ExperimentService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
