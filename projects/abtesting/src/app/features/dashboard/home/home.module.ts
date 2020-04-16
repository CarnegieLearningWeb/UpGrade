import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../../shared/shared.module';

import { HomeComponent } from './root/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { ExperimentListComponent } from './components/experiment-list/experiment-list.component';
import { ExperimentStatePipe } from './pipes/experiment-state.pipe';
import { FormatDatePipe } from './pipes/format-date.pipe';
import { FormsModule } from '@angular/forms';
import { NewExperimentComponent } from './components/modal/new-experiment/new-experiment.component';
import { ExperimentOverviewComponent } from './components/experiment-overview/experiment-overview.component';
import { ExperimentDesignComponent } from './components/experiment-design/experiment-design.component';
import { ExperimentScheduleComponent } from './components/experiment-schedule/experiment-schedule.component';
import { ViewExperimentComponent } from './pages/view-experiment/view-experiment.component';
import { ExperimentStatusComponent } from './components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from './components/modal/post-experiment-rule/post-experiment-rule.component';
import { MatDatepickerModule } from '@angular/material';
import { EnrollmentOverTimeComponent } from './components/enrollment-over-time/enrollment-over-time.component';
import { EnrollmentConditionTableComponent } from './components/enrollment-condition-table/enrollment-condition-table.component';
import { EnrollmentPointPartitionTableComponent } from './components/enrollment-point-partition-table/enrollment-point-partition-table.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { ExperimentPostConditionComponent } from './components/experiment-post-condition/experiment-post-condition.component';
import { DeleteExperimentComponent } from './components/modal/delete-experiment/delete-experiment.component';
import { CdkTableModule } from '@angular/cdk/table';

@NgModule({
  declarations: [
    HomeComponent,
    ExperimentListComponent,
    ExperimentStatePipe,
    FormatDatePipe,
    NewExperimentComponent,
    ExperimentOverviewComponent,
    ExperimentDesignComponent,
    ExperimentScheduleComponent,
    ViewExperimentComponent,
    ExperimentStatusComponent,
    PostExperimentRuleComponent,
    EnrollmentOverTimeComponent,
    EnrollmentConditionTableComponent,
    EnrollmentPointPartitionTableComponent,
    ExperimentPostConditionComponent,
    DeleteExperimentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    HomeRoutingModule,
    MatDatepickerModule,
    NgxChartsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    CdkTableModule
  ],
  providers: [],
  entryComponents: [
    NewExperimentComponent,
    ExperimentStatusComponent,
    PostExperimentRuleComponent,
    DeleteExperimentComponent
  ]
})
export class HomeModule {}
