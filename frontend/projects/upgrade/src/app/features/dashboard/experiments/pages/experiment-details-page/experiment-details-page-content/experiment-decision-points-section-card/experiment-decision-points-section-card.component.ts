import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentDecisionPointsTableComponent } from './experiment-decision-points-table/experiment-decision-points-table.component';

@Component({
  selector: 'app-experiment-decision-points-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentDecisionPointsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-decision-points-section-card.component.html',
  styleUrl: './experiment-decision-points-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDecisionPointsSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and table component integration

  onAddDecisionPointClick(): void {
    // TODO: Implement add decision point functionality
  }

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
