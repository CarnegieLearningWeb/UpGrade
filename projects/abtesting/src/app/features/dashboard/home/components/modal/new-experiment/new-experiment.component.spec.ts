import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewExperimentComponent } from './new-experiment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentOverviewComponent } from '../../experiment-overview/experiment-overview.component';
import { ExperimentDesignComponent } from '../../experiment-design/experiment-design.component';
import { ExperimentScheduleComponent } from '../../experiment-schedule/experiment-schedule.component';
import { ExperimentPostConditionComponent } from '../../experiment-post-condition/experiment-post-condition.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';

describe('NewExperimentComponent', () => {
  let component: NewExperimentComponent;
  let fixture: ComponentFixture<NewExperimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        NewExperimentComponent,
        ExperimentOverviewComponent,
        ExperimentDesignComponent,
        ExperimentScheduleComponent,
        ExperimentPostConditionComponent
      ],
      imports: [TestingModule, OwlDateTimeModule, OwlNativeDateTimeModule,],
      providers: [ExperimentService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewExperimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
