import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { HomeComponent } from './root/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { ExperimentListComponent } from './components/experiment-list/experiment-list.component';
import { ExperimentStateColorPipe } from './pipes/experiment-state-color.pipe';
import { FormatDatePipe } from './pipes/format-date.pipe';
import { FormsModule } from '@angular/forms';
import { NewExperimentComponent } from './components/modal/new-experiment/new-experiment.component';
import { ExperimentOverviewComponent } from './components/experiment-overview/experiment-overview.component';
import { ExperimentDesignComponent } from './components/experiment-design/experiment-design.component';
import { ExperimentScheduleComponent } from './components/experiment-schedule/experiment-schedule.component';

@NgModule({
  declarations: [
    HomeComponent,
    ExperimentListComponent,
    ExperimentStateColorPipe,
    FormatDatePipe,
    NewExperimentComponent,
    ExperimentOverviewComponent,
    ExperimentDesignComponent,
    ExperimentScheduleComponent
  ],
  imports: [CommonModule, FormsModule, SharedModule, HomeRoutingModule],
  providers: [],
  entryComponents: [NewExperimentComponent]
})
export class HomeModule {}
