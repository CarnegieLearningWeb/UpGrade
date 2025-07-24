import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-decision-points-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-decision-points-table.component.html',
  styleUrl: './experiment-decision-points-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDecisionPointsTableComponent {
  // TODO: Implement decision points table functionality
}
