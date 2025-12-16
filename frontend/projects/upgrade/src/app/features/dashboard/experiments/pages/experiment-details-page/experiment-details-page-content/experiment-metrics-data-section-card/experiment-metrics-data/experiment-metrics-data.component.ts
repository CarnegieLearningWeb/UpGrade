import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentQueryResultComponent } from '../../../../../../home/components/experiment-query-result/experiment-query-result.component';
import { ExperimentVM } from '../../../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-experiment-metrics-data',
  imports: [CommonModule, TranslateModule, ExperimentQueryResultComponent],
  templateUrl: './experiment-metrics-data.component.html',
  styleUrl: './experiment-metrics-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentMetricsDataComponent {
  @Input() experiment: ExperimentVM;
}
