import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalysisRoutingModule } from './analysis-routing.module';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [AnalysisRootComponent],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule
  ]
})
export class AnalysisModule { }
