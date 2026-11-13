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
  @Input() scalingFactor = 1;

  get isScaled(): boolean {
    return this.scalingFactor !== 1;
  }

  groupHeaderColumns = [
    'conditionGroup',
    'successesGroup',
    'spacerGroup',
    'failuresGroup',
    'spacer2Group',
    'estimatedWeightGroup',
  ];

  // Condition/spacer/spacer2/estimatedWeight get real (if blank-topped) cells in both header rows
  // rather than a rowspan, so their label sits in the same single-row cell as Count/Prior/Posterior
  // -- that's what makes a shared `vertical-align: middle` center all of them on the same line, and
  // lets the row1/row2 divider border-top carry all the way across instead of stopping at a rowspan.
  subHeaderColumns = [
    'conditionCode',
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

  /**
   * Display values for one Successes or Failures group: Count shows `count (scaledCount)` when α
   * isn't 1 (scaledCount = count × α), and Posterior shows `prior + scaledCount`. `posterior` is the
   * backend's value (what the algorithm actually draws from); it's only recomputed here for the
   * placeholder rows shown before a rewards summary has loaded.
   */
  scaledValues(
    prior: number | undefined,
    count: number,
    posterior: number | undefined
  ): { scaledCount: string; posterior: string } {
    const scaledCount = this.scalingFactor * count;
    return {
      scaledCount: toHundredths(scaledCount),
      posterior: toHundredths(posterior ?? (prior ?? 1) + scaledCount),
    };
  }
}

function toHundredths(value: number): string {
  return String(Math.round(value * 100) / 100);
}
