import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentRewardsSummary } from 'upgrade_types';

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
    'spacer',
    'failures',
    'failurePrior',
    'failurePosterior',
    'estimatedWeight',
  ];
}
