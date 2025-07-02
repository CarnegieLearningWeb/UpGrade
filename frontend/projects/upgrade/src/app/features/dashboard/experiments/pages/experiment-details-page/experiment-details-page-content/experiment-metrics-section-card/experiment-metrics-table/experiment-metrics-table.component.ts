import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-metrics-table',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-metrics-table.component.html',
  styleUrl: './experiment-metrics-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsTableComponent {
  // TODO: Implement metrics table functionality
}
