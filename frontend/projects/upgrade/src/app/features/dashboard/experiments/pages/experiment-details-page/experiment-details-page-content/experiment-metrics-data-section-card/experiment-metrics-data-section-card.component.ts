import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentMetricsDataComponent } from './experiment-metrics-data/experiment-metrics-data.component';

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
export class ExperimentMetricsDataSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and ExperimentMetricsDataComponent integration

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
