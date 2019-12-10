import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';

import { HomeComponent } from './root/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { ExperimentListComponent } from './components/experiment-list/experiment-list.component';
import { ExperimentStateColorPipe } from './components/pipes/experiment-state-color.pipe';
import { FormatDatePipe } from './components/pipes/format-date.pipe';

@NgModule({
  declarations: [HomeComponent, ExperimentListComponent, ExperimentStateColorPipe, FormatDatePipe],
  imports: [CommonModule, SharedModule, HomeRoutingModule],
  providers: []
})
export class HomeModule {}
