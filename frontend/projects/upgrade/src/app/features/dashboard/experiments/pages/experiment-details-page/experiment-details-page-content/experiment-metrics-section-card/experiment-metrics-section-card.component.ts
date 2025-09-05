import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import {
  ExperimentMetricsTableComponent,
  ExperimentQueryRowActionEvent,
} from './experiment-metrics-table/experiment-metrics-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable, map } from 'rxjs';
import {
  Experiment,
  EXPERIMENT_BUTTON_ACTION,
  EXPERIMENT_ROW_ACTION,
} from '../../../../../../../core/experiments/store/experiments.model';
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
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;

  tableRowCount$ = this.selectedExperiment$.pipe(map((experiment) => experiment?.queries?.length || 0));

  get tableRowCount(): number {
    let count = 0;
    this.tableRowCount$.subscribe((val) => (count = val));
    return count;
  }

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

  onRowAction(event: ExperimentQueryRowActionEvent, experimentId: string): void {
    switch (event.action) {
      case EXPERIMENT_ROW_ACTION.EDIT:
        this.onEditMetric(event.query, experimentId);
        break;
      case EXPERIMENT_ROW_ACTION.DELETE:
        this.onDeleteMetric(event.query, experimentId);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  private onEditMetric(query: any, experimentId: string): void {
    // TODO: Implement edit metric functionality when dialog service is available
    console.log('Edit metric clicked for query:', query.id, 'in experiment:', experimentId);
  }

  private onDeleteMetric(query: any, experimentId: string): void {
    // TODO: Implement delete metric functionality when dialog service is available
    console.log('Delete metric clicked for query:', query.id, 'in experiment:', experimentId);
  }
}
