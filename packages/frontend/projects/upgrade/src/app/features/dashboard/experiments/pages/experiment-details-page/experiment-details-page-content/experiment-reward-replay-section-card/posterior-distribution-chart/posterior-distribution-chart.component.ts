import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ReplayStep } from '../../../../../../../../core/experiments/thompson-sampling-replay.util';
import {
  ReplayChartSeries,
  ReplayConditionDisplay,
  formatPercentTick,
  posteriorDistributionChart,
} from '../../../../../../../../core/experiments/thompson-sampling-replay-chart.util';

/**
 * The conditions' posterior Beta distributions at the reward selected in the Replay Stepper,
 * overlaid on one 0–100% success-rate axis.
 */
@Component({
  selector: 'app-posterior-distribution-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgxChartsModule],
  templateUrl: './posterior-distribution-chart.component.html',
  styleUrl: './posterior-distribution-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosteriorDistributionChartComponent implements OnChanges {
  @Input() steps: ReplayStep[] = [];
  @Input() conditions: ReplayConditionDisplay[] = [];
  @Input() selectedIndex = 0;

  chartData: ReplayChartSeries[] = [];
  colorScheme = { domain: [] as string[] };
  readonly formatXAxisTick = formatPercentTick;
  /**
   * No y-axis ticks: density values (which can run well above 1) aren't meaningful to read off, so
   * the axis shows only its label. ngx-charts renders that label only when the y-axis is on.
   */
  readonly yAxisTicks: number[] = [];

  ngOnChanges(): void {
    const { results, colors } = posteriorDistributionChart(this.steps, this.conditions, this.selectedIndex);
    this.chartData = results;
    this.colorScheme = { domain: colors };
  }
}
