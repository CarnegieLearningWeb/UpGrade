import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentInclusionsTableComponent } from './experiment-inclusions-table/experiment-inclusions-table.component';

@Component({
  selector: 'app-experiment-inclusions-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentInclusionsTableComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-inclusions-section-card.component.html',
  styleUrl: './experiment-inclusions-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentInclusionsSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and ExperimentInclusionsTableComponent integration

  onAddInclusionClick(): void {
    // TODO: Implement add inclusion functionality
  }

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
