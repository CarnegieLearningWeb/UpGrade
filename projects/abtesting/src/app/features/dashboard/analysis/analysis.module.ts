import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalysisRoutingModule } from './analysis-routing.module';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { ExperimentAnalysisComponent } from './components/experiment-analysis/experiment-analysis.component';

@NgModule({
  declarations: [AnalysisRootComponent, ExperimentAnalysisComponent],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule
  ]
})
export class AnalysisModule { }
