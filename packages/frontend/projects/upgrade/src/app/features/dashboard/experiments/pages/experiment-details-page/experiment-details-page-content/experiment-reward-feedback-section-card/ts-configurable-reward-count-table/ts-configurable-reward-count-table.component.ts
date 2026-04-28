import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentRewardsByCondition, ExperimentRewardsSummary } from 'upgrade_types';

@Component({
  selector: 'app-ts-configurable-reward-count-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressBarModule, MatTooltipModule, TranslateModule],
  templateUrl: './ts-configurable-reward-count-table.component.html',
  styleUrl: './ts-configurable-reward-count-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TSConfigurableRewardCountTableComponent {
  @Input() dataSource: ExperimentRewardsSummary = [];
  @Input() isLoading = false;

  displayedColumns = [
    'conditionCode',
    'successes',
    'successPrior',
    'successPosterior',
    'failures',
    'failurePrior',
    'failurePosterior',
    'estimatedWeight',
  ];

  getEstimatedWeightTooltip(row: ExperimentRewardsByCondition): string {
    const alpha = row.posteriorSuccesses ?? 0;
    const beta = row.posteriorFailures ?? 0;
    return `α: posteriors(${alpha})\nβ: posteriors(${beta})\nbeta(${alpha}, ${beta})`;
  }
}
