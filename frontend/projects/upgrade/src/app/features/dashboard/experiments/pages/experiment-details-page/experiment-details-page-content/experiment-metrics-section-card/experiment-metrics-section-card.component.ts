import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ExperimentMetricsTableComponent,
  ExperimentQueryRowActionEvent,
} from './experiment-metrics-table/experiment-metrics-table.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { MetricHelperService } from '../../../../../../../core/experiments/metric-helper.service';
import { Observable, map, combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  Experiment,
  EXPERIMENT_ROW_ACTION,
  ExperimentQueryDTO,
  EXPERIMENT_SECTION_CARD_TYPE,
} from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
import {
  getSectionCardRestriction,
  SectionCardRestriction,
} from '../../../../../../../core/experiments/experiment-status-restriction-helper.service';

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

  selectedExperiment$ = this.experimentService.selectedExperiment$;
  vm$: Observable<{ experiment: Experiment; permissions: UserPermission; restriction: SectionCardRestriction }>;

  constructor(
    readonly experimentService: ExperimentService,
    private readonly metricHelperService: MetricHelperService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit() {
    this.vm$ = combineLatest([this.selectedExperiment$, this.authService.userPermissions$]).pipe(
      map(([experiment, permissions]) => ({
        experiment,
        permissions,
        restriction: getSectionCardRestriction(EXPERIMENT_SECTION_CARD_TYPE.METRICS, experiment?.state),
      }))
    );
  }

  onAddMetricClick(): void {
    // Get experiment ID from selected experiment
    this.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
      if (experiment?.id) {
        this.dialogService.openAddMetricModal(experiment.id);
      }
    });
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
        this.onDeleteMetric(event.query);
        break;
      default:
        console.log('Unknown action:', event.action);
    }
  }

  private onEditMetric(query: ExperimentQueryDTO, experimentId: string): void {
    this.dialogService.openEditMetricModal(query, experimentId);
  }

  private onDeleteMetric(query: ExperimentQueryDTO): void {
    const metricDisplayName = query.name || `${query.metric?.key}`;

    this.dialogService
      .openDeleteMetricModal(metricDisplayName)
      .afterClosed()
      .subscribe((confirmClicked) => {
        if (confirmClicked) {
          this.selectedExperiment$.pipe(take(1)).subscribe((experiment: Experiment) => {
            if (experiment) {
              this.metricHelperService.deleteMetric(experiment, query);
            }
          });
        }
      });
  }
}
