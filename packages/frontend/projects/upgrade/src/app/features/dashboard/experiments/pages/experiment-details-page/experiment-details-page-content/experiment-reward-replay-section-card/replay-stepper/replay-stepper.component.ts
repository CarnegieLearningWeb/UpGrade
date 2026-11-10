import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExperimentRewardsReplayReward } from 'upgrade_types';
import {
  ReplayConditionState,
  ReplayStep,
} from '../../../../../../../../core/experiments/thompson-sampling-replay.util';
import {
  ReplayConditionDisplay,
  clampStepIndex,
  formatPosterior,
  formatPosteriorParameter,
} from '../../../../../../../../core/experiments/thompson-sampling-replay-chart.util';
import { PosteriorDistributionChartComponent } from '../posterior-distribution-chart/posterior-distribution-chart.component';

/**
 * Steps through an adaptive experiment's rewards one at a time. For the selected reward it shows the
 * conditions' posterior distributions and, per condition, its posterior and mean, with the outcome
 * on the row of the condition the reward went to.
 */
@Component({
  selector: 'app-replay-stepper',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatTooltipModule,
    PosteriorDistributionChartComponent,
  ],
  templateUrl: './replay-stepper.component.html',
  styleUrl: './replay-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayStepperComponent {
  @Input() steps: ReplayStep[] = [];
  @Input() conditions: ReplayConditionDisplay[] = [];
  @Input() selectedIndex = 0;
  @Input() scalingFactor = 1;
  @Output() selectedIndexChange = new EventEmitter<number>();

  get rewardAmount(): string {
    return formatPosteriorParameter(this.scalingFactor);
  }

  get lastIndex(): number {
    return this.steps.length - 1;
  }

  get step(): ReplayStep {
    return this.steps[this.selectedIndex];
  }

  select(index: number): void {
    const clamped = clampStepIndex(index, this.steps.length);
    if (clamped !== this.selectedIndex) {
      this.selectedIndexChange.emit(clamped);
    }
  }

  /** The selected step's reward if it went to this condition, otherwise null. */
  rewardFor(condition: ReplayConditionDisplay): ExperimentRewardsReplayReward | null {
    const reward = this.step.reward;
    return reward?.conditionId === condition.conditionId ? reward : null;
  }

  posteriorLabel(state: ReplayConditionState): string {
    return formatPosterior(state);
  }
}
