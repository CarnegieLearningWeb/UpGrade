import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentRewardsByCondition } from 'upgrade_types';

@Component({
  selector: 'app-ts-configurable-reward-count-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressBarModule, MatTooltipModule, TranslateModule],
  templateUrl: './ts-configurable-reward-count-table.component.html',
  styleUrl: './ts-configurable-reward-count-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TSConfigurableRewardCountTableComponent {
  @Input() dataSource: ExperimentRewardsByCondition[] = [];
  @Input() isLoading = false;

  groupHeaderColumns = [
    'conditionGroup',
    'receivedGroup',
    'receivedSpacerGroup',
    'successesGroup',
    'spacerGroup',
    'failuresGroup',
    'spacer2Group',
    'estimatedWeightGroup',
  ];

  // Condition/received/the spacers/estimatedWeight get real (if blank-topped) cells in both header
  // rows rather than a rowspan, so their label sits in the same single-row cell as Count/Prior/Posterior
  // -- that's what makes a shared `vertical-align: middle` center all of them on the same line, and
  // lets the row1/row2 divider border-top carry all the way across instead of stopping at a rowspan.
  subHeaderColumns = [
    'conditionCode',
    'received',
    'receivedSpacer',
    'successes',
    'successPrior',
    'successPosterior',
    'spacer',
    'failures',
    'failurePrior',
    'failurePosterior',
    'spacer2',
    'estimatedWeight',
  ];

  displayedColumns = [
    'conditionCode',
    'received',
    'receivedSpacer',
    'successes',
    'successPrior',
    'successPosterior',
    'spacer',
    'failures',
    'failurePrior',
    'failurePosterior',
    'spacer2',
    'estimatedWeight',
  ];

  // estimatedWeight is a 10,000-draw simulation rounded to an integer, so 0 or 100 only means
  // "under 1%" / "over 99%", never certainty -- except for a lone condition, which the backend pins
  // at exactly 100 because it genuinely wins every draw.
  formatEstimatedWeight(estimatedWeight: number | undefined): string {
    if (estimatedWeight == null) return '—';
    if (this.dataSource.length > 1) {
      if (estimatedWeight < 1) return '<1%';
      if (estimatedWeight > 99) return '>99%';
    }
    return `≈${estimatedWeight}%`;
  }
}
