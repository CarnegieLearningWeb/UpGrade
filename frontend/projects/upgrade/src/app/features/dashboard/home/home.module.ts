import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../../shared/shared.module';

import { HomeComponent } from './root/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { ExperimentListComponent } from './components/experiment-list/experiment-list.component';
import { FormsModule } from '@angular/forms';
import { NewExperimentComponent } from './components/modal/new-experiment/new-experiment.component';
import { ExperimentOverviewComponent } from './components/experiment-overview/experiment-overview.component';
import { ExperimentDesignComponent } from './components/experiment-design/experiment-design.component';
import { MonitoredMetricsComponent } from './components/metrics/metrics.component';
import { ExperimentScheduleComponent } from './components/experiment-schedule/experiment-schedule.component';
import { ViewExperimentComponent } from './pages/view-experiment/view-experiment.component';
import { ExperimentStatusComponent } from './components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from './components/modal/post-experiment-rule/post-experiment-rule.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { EnrollmentOverTimeComponent } from './components/enrollment-over-time/enrollment-over-time.component';
import { EnrollmentConditionTableComponent } from './components/enrollment-condition-table/enrollment-condition-table.component';
import { EnrollmentPointPartitionTableComponent } from './components/enrollment-point-partition-table/enrollment-point-partition-table.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { ExperimentPostConditionComponent } from './components/experiment-post-condition/experiment-post-condition.component';
import { TableRowComponent } from './components/table-row/table-row.component';
import { QueriesModalComponent } from './components/modal/queries-modal/queries-modal.component';
import { CreateQueryComponent } from './components/create-query/create-query.component';
import { OperationPipe } from '../../../shared/pipes/operation.pipe';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ExperimentQueryResultComponent } from './components/experiment-query-result/experiment-query-result.component';
import { ExperimentEndCriteriaComponent } from './components/modal/experiment-end-criteria/experiment-end-criteria.component';
import { RepeatedMeasurePipe } from './pipes/repeated-measure.pipe';
import { ImportExperimentComponent } from './components/modal/import-experiment/import-experiment.component';
import { StateTimeLogsComponent } from './components/modal/state-time-logs/state-time-logs.component';
import { ExperimentParticipantsComponent } from './components/experiment-participants/experiment-participants.component';
import { ExportModalComponent } from './components/modal/export-experiment/export-experiment.component';
import { PayloadsTableComponent } from './components/experiment-design/payloads-table/payloads-table.component';
import { FactorialExperimentDesignComponent } from './components/factorial-experiment-design/factorial-experiment-design.component';
import { ConditionsTableComponent } from './components/factorial-experiment-design/conditions-table/conditions-table.component';
@NgModule({
  declarations: [
    HomeComponent,
    ExperimentListComponent,
    NewExperimentComponent,
    ExperimentOverviewComponent,
    ExperimentDesignComponent,
    MonitoredMetricsComponent,
    ExperimentScheduleComponent,
    ViewExperimentComponent,
    ExperimentStatusComponent,
    PostExperimentRuleComponent,
    EnrollmentOverTimeComponent,
    EnrollmentConditionTableComponent,
    EnrollmentPointPartitionTableComponent,
    ExperimentPostConditionComponent,
    ImportExperimentComponent,
    TableRowComponent,
    QueriesModalComponent,
    CreateQueryComponent,
    ExperimentQueryResultComponent,
    ExperimentEndCriteriaComponent,
    RepeatedMeasurePipe,
    StateTimeLogsComponent,
    ExperimentParticipantsComponent,
    ExportModalComponent,
    PayloadsTableComponent,
    FactorialExperimentDesignComponent,
    ConditionsTableComponent,
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
    NgxSkeletonLoaderModule,
  ],
  providers: [OperationPipe],
})
export class HomeModule {}
