import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalysisRoutingModule } from './analysis-routing.module';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { MetricsComponent } from './components/metrics/metrics.component';

@NgModule({
  declarations: [AnalysisRootComponent, MetricsComponent],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule
  ]
})
export class AnalysisModule { }
