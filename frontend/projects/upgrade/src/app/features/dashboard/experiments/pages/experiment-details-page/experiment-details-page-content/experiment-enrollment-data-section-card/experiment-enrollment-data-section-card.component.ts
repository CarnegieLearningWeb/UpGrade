import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentEnrollmentDataComponent } from './experiment-enrollment-data/experiment-enrollment-data.component';

@Component({
  selector: 'app-experiment-enrollment-data-section-card',
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ExperimentEnrollmentDataComponent,
    TranslateModule,
  ],
  templateUrl: './experiment-enrollment-data-section-card.component.html',
  styleUrl: './experiment-enrollment-data-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentEnrollmentDataSectionCardComponent {
  @Input() isSectionCardExpanded = true;

  // TODO: Add experiment data input and ExperimentEnrollmentDataComponent integration

  onSectionCardExpandChange(expanded: boolean): void {
    // TODO: Emit to parent component if needed
  }
}
