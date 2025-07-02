import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentExclusionsTableComponent } from './experiment-exclusions-table/experiment-exclusions-table.component';

@Component({
  selector: 'app-experiment-exclusions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentExclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-exclusions-section-card.component.html',
  styleUrl: './experiment-exclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentExclusionsSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and ExperimentExclusionsTableComponent integration

  onAddExclusionClick(): void {
    // TODO: Implement add exclusion functionality
  }

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
