import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentConditionsTableComponent } from './experiment-conditions-table/experiment-conditions-table.component';

@Component({
  selector: 'app-experiment-conditions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentConditionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-conditions-section-card.component.html',
  styleUrl: './experiment-conditions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentConditionsSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and table component integration

  onAddConditionClick(): void {
    // TODO: Implement add condition functionality
  }

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
