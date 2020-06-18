import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalysisRoutingModule } from './analysis-routing.module';
import { AnalysisRootComponent } from './analysis-root/analysis-root.component';
import { SharedModule } from '../../../shared/shared.module';
import { MetricsComponent } from './components/metrics/metrics.component';
import { DeleteMetricComponent } from './components/modal/delete-metric/delete-metric.component';
import { AddMetricsComponent } from './components/modal/add-metrics/add-metrics.component';
import { NgJsonEditorModule } from 'ang-jsoneditor';

@NgModule({
  declarations: [AnalysisRootComponent, MetricsComponent, DeleteMetricComponent, AddMetricsComponent],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule,
    NgJsonEditorModule
  ],
  entryComponents: [DeleteMetricComponent, AddMetricsComponent]
})
export class AnalysisModule { }
