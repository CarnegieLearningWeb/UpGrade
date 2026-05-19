import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '@shared-component-lib';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentQueryResultComponent } from './experiment-query-result/experiment-query-result.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { AuthService } from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-experiment-metrics-data-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentQueryResultComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-metrics-data-section-card.component.html',
  styleUrl: './experiment-metrics-data-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsDataSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  selectedExperiment$ = this.experimentService.selectedExperiment$;
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;

  constructor(private readonly experimentService: ExperimentService, private readonly authService: AuthService) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
