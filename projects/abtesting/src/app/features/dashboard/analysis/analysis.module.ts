import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalysisRoutingModule } from './analysis-routing.module';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { MetricsComponent } from './components/metrics/metrics.component';
import { QueriesComponent } from './components/queries/queries.component';

@NgModule({
  declarations: [AnalysisRootComponent, MetricsComponent, QueriesComponent],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule
  ]
})
export class AnalysisModule { }
