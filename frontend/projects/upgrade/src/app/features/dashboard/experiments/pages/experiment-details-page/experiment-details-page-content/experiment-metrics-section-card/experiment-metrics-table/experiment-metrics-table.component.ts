import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';
import {
  ExperimentQueryDTO,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../../core/experiments/store/experiments.model';
import { METRICS_JOIN_TEXT } from '../../../../../../../../core/analysis/store/analysis.models';
import { SharedModule } from '../../../../../../../../shared/shared.module';

export interface ExperimentQueryRowActionEvent {
  action: EXPERIMENT_ROW_ACTION;
  query: ExperimentQueryDTO;
}

@Component({
  selector: 'app-experiment-metrics-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    SharedModule,
  ],
  templateUrl: './experiment-metrics-table.component.html',
  styleUrl: './experiment-metrics-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsTableComponent {
  @Input() queries: ExperimentQueryDTO[] = [];
  @Input() isLoading$: Observable<boolean>;
  @Input() actionsDisabled?: boolean = false;
  @Output() rowAction = new EventEmitter<ExperimentQueryRowActionEvent>();

  displayedColumns: string[] = ['metric', 'statistic', 'displayName', 'actions'];

  METRIC_TRANSLATION_KEYS = {
    METRIC: 'experiments.details.metrics.metric.text',
    STATISTIC: 'experiments.details.metrics.statistic.text',
    DISPLAY_NAME: 'experiments.details.metrics.display-name.text',
    ACTIONS: 'experiments.details.metrics.actions.text',
  };

  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' },
  ];

  getMetricKeys(query: ExperimentQueryDTO): string[] {
    if (!query.metric?.key) {
      return [];
    }

    // Split keys by the join text to show them on separate lines
    return query.metric.key.split(METRICS_JOIN_TEXT);
  }

  getStatisticOperations(query: ExperimentQueryDTO): string[] {
    const operations: string[] = [];
    const queryData = query.query as any; // Type assertion since query is object type

    // Step 1: Add repeated measure if metric has multiple keys (FIRST for group metrics)
    const metricKeys = this.getMetricKeys(query);
    if (metricKeys.length > 1 && query.repeatedMeasure) {
      operations.push(this.formatRepeatedMeasure(query.repeatedMeasure));
    }

    // Step 2: Add operation type (FIRST for categorical, SECOND for group metrics)
    if (queryData?.operationType) {
      operations.push(this.formatOperationType(queryData.operationType));
    }

    // Step 3: Add comparison function and value for categorical metrics (AFTER operation type)
    if ((query.metric as any)?.type === IMetricMetaData.CATEGORICAL) {
      if (queryData?.compareFn) {
        const compareFn = this.comparisonFns.find((fn) => fn.value === queryData.compareFn);
        if (compareFn) {
          operations.push(compareFn.viewValue);
        }
      }
      if (queryData?.compareValue) {
        operations.push(queryData.compareValue);
      }
    }

    return operations;
  }

  private formatOperationType(operationType: OPERATION_TYPES): string {
    const operationMap: Record<OPERATION_TYPES, string> = {
      [OPERATION_TYPES.SUM]: 'Sum',
      [OPERATION_TYPES.MIN]: 'Min',
      [OPERATION_TYPES.MAX]: 'Max',
      [OPERATION_TYPES.COUNT]: 'Count',
      [OPERATION_TYPES.AVERAGE]: 'Mean',
      [OPERATION_TYPES.MODE]: 'Mode',
      [OPERATION_TYPES.MEDIAN]: 'Median',
      [OPERATION_TYPES.STDEV]: 'Standard Deviation',
      [OPERATION_TYPES.PERCENTAGE]: 'Percentage',
    };

    return operationMap[operationType] || operationType;
  }

  private formatRepeatedMeasure(repeatedMeasure: REPEATED_MEASURE): string {
    // Format repeated measure for display
    return repeatedMeasure.replace(/_/g, ' ').toLowerCase();
  }

  onEditButtonClick(query: ExperimentQueryDTO): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.EDIT, query });
  }

  onDeleteButtonClick(query: ExperimentQueryDTO): void {
    this.rowAction.emit({ action: EXPERIMENT_ROW_ACTION.DELETE, query });
  }
}
