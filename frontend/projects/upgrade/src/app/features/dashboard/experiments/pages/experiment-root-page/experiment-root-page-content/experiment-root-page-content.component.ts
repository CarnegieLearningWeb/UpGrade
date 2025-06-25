import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { ExperimentRootSectionCardComponent } from './experiment-root-section-card/experiment-root-section-card.component';

@Component({
  selector: 'app-experiment-root-page-content',
  imports: [CommonSectionCardListComponent, ExperimentRootSectionCardComponent],
  templateUrl: './experiment-root-page-content.component.html',
  styleUrl: './experiment-root-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootPageContentComponent {}
