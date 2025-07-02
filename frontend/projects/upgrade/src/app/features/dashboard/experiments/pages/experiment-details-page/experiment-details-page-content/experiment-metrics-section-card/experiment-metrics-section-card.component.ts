import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentMetricsTableComponent } from './experiment-metrics-table/experiment-metrics-table.component';

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
export class ExperimentMetricsSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and ExperimentMetricsTableComponent integration

  onAddMetricClick(): void {
    // TODO: Implement add metric functionality
  }

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
