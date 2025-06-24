import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-experiment-root-section-card',
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
  ],
  templateUrl: './experiment-root-section-card.component.html',
  styleUrl: './experiment-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootSectionCardComponent {}
