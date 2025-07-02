import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment-metrics-data',
  imports: [CommonModule, TranslateModule],
  templateUrl: './experiment-metrics-data.component.html',
  styleUrl: './experiment-metrics-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsDataComponent {
  // TODO: Implement metrics data functionality
}
