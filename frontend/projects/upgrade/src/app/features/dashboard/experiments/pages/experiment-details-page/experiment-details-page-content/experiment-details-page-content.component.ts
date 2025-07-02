import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { ExperimentOverviewDetailsSectionCardComponent } from './experiment-overview-details-section-card/experiment-overview-details-section-card.component';
import { ExperimentDecisionPointsSectionCardComponent } from './experiment-decision-points-section-card/experiment-decision-points-section-card.component';
import { ExperimentConditionsSectionCardComponent } from './experiment-conditions-section-card/experiment-conditions-section-card.component';
import { ExperimentInclusionsSectionCardComponent } from './experiment-inclusions-section-card/experiment-inclusions-section-card.component';
import { ExperimentExclusionsSectionCardComponent } from './experiment-exclusions-section-card/experiment-exclusions-section-card.component';
import { ExperimentMetricsSectionCardComponent } from './experiment-metrics-section-card/experiment-metrics-section-card.component';
import { ExperimentEnrollmentDataSectionCardComponent } from './experiment-enrollment-data-section-card/experiment-enrollment-data-section-card.component';
import { ExperimentMetricsDataSectionCardComponent } from './experiment-metrics-data-section-card/experiment-metrics-data-section-card.component';

@Component({
  selector: 'app-experiment-details-page-content',
  imports: [
    CommonModule,
    CommonSectionCardListComponent,
    ExperimentOverviewDetailsSectionCardComponent,
    ExperimentDecisionPointsSectionCardComponent,
    ExperimentConditionsSectionCardComponent,
    ExperimentInclusionsSectionCardComponent,
    ExperimentExclusionsSectionCardComponent,
    ExperimentMetricsSectionCardComponent,
    ExperimentEnrollmentDataSectionCardComponent,
    ExperimentMetricsDataSectionCardComponent,
  ],
  templateUrl: './experiment-details-page-content.component.html',
  styleUrl: './experiment-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDetailsPageContentComponent {
  // TODO: Implement experiment data and state management
  isSectionCardExpanded = true;

  onSectionCardExpandChange(expanded: boolean): void {
    this.isSectionCardExpanded = expanded;
  }
}
