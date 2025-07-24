import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';
import { ExperimentMetricsDataComponent } from './experiment-metrics-data/experiment-metrics-data.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { Observable } from 'rxjs';
import { Experiment, EXPERIMENT_BUTTON_ACTION } from '../../../../../../../core/experiments/store/experiments.model';
import { UserPermission } from '../../../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-metrics-data-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentMetricsDataComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-metrics-data-section-card.component.html',
  styleUrl: './experiment-metrics-data-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsDataSectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;

  permissions$: Observable<UserPermission>;
  selectedExperiment$ = this.experimentService.selectedExperiment$;

  menuButtonItems: IMenuButtonItem[] = [
    {
      label: 'experiments.details.export-metrics-data.menu-item.text',
      action: EXPERIMENT_BUTTON_ACTION.EXPORT_METRICS_DATA,
      disabled: false,
    },
  ];

  constructor(private experimentService: ExperimentService, private authService: AuthService) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
  }

  onMenuButtonItemClick(event: string, experiment: Experiment): void {
    switch (event) {
      case EXPERIMENT_BUTTON_ACTION.EXPORT_METRICS_DATA:
        // TODO: Implement export metrics data functionality when experiment service methods are available
        console.log('Export metrics data clicked for experiment:', experiment.id);
        break;
      default:
        console.log('Unknown action:', event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
