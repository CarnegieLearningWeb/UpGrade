import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { ExperimentMetricsTableComponent } from './experiment-metrics-table/experiment-metrics-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable } from 'rxjs';
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-metrics-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentMetricsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-metrics-section-card.component.html',
  styleUrl: './experiment-metrics-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  // TODO: Add tableRowCount$ when experiment metrics are implemented
  tableRowCount = 0;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.import-metric.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.IMPORT_METRIC,
      disabled: false,
    },
    {
      label: 'experiments.details.export-all-metrics.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_METRICS,
      disabled: false,
    },
  ];

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onAddMetricClick(): void {
    // TODO: Implement add metric functionality when dialog service is available
    console.log('Add metric clicked');
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.IMPORT_METRIC:
        // TODO: Implement import functionality when dialog service is available
        console.log('Import metric clicked for experiment:', experiment.id);
        break;
      case EXPERIMENT_BUTTON_ACTION.EXPORT_ALL_METRICS:
        // TODO: Implement export functionality when experiment service methods are available
        console.log('Export all metrics clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  // TODO: Add row action methods when experiment metrics table events are implemented
  // onRowAction(event: ExperimentMetricRowActionEvent, experimentId: string): void {}
  // onEditMetric(rowData: ExperimentMetricTableRow, experimentId: string): void {}
  // onDeleteMetric(metric: ExperimentMetric): void {}
}
