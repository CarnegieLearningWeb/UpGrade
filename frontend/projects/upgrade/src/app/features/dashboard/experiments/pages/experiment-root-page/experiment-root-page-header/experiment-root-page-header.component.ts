import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonRootPageHeaderComponent } from '../../../../../../shared-standalone-component-lib/components';

@Component({
  selector: 'app-experiment-root-page-header',
  imports: [CommonRootPageHeaderComponent],
  templateUrl: './experiment-root-page-header.component.html',
  styleUrl: './experiment-root-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRootPageHeaderComponent {}
