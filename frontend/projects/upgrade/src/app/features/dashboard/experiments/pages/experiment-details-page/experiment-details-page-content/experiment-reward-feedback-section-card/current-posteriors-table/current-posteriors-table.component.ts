import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CurrentPosteriorsTableRow } from '../../../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-current-posteriors-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressBarModule, TranslateModule],
  templateUrl: './current-posteriors-table.component.html',
  styleUrl: './current-posteriors-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentPosteriorsTableComponent {
  @Input() dataSource: CurrentPosteriorsTableRow[] = [];
  @Input() isLoading = false;

  displayedColumns = ['conditionCode', 'successes', 'failures', 'total', 'percentage'];

  // Calculate totals for the totals row
  get totalSuccesses(): number {
    return this.dataSource.reduce((sum, row) => sum + row.successes, 0);
  }

  get totalFailures(): number {
    return this.dataSource.reduce((sum, row) => sum + row.failures, 0);
  }

  get grandTotal(): number {
    return this.dataSource.reduce((sum, row) => sum + row.total, 0);
  }

  get totalPercentage(): number {
    return this.dataSource.reduce((sum, row) => sum + row.percentage, 0);
  }
}
