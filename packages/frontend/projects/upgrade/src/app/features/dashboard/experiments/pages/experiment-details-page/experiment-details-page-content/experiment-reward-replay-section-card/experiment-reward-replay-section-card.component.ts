import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, map } from 'rxjs';
import { CommonSectionCardComponent } from '@shared-component-lib/common-section-card/common-section-card.component';
import { CommonSectionCardTitleHeaderComponent } from '@shared-component-lib/common-section-card-title-header/common-section-card-title-header.component';
import { CommonSectionCardActionButtonsComponent } from '@shared-component-lib/common-section-card-action-buttons/common-section-card-action-buttons.component';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { ReplayStepperComponent } from './replay-stepper/replay-stepper.component';
import {
  RewardReplayView,
  buildRewardReplayView,
  clampStepIndex,
} from '../../../../../../../core/experiments/thompson-sampling-replay-chart.util';

@Component({
  selector: 'app-experiment-reward-replay-section-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatProgressBarModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    ReplayStepperComponent,
  ],
  templateUrl: './experiment-reward-replay-section-card.component.html',
  styleUrl: './experiment-reward-replay-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRewardReplaySectionCardComponent implements OnInit {
  @Input() isSectionCardExpanded = true;
  replayView$: Observable<RewardReplayView | null>;
  isLoading$: Observable<boolean>;
  /** The step chosen in the Replay Stepper; null means "latest", so new data opens on the current posteriors. */
  selectedStepIndex: number | null = null;

  private readonly experimentService = inject(ExperimentService);

  ngOnInit(): void {
    // Refetch on every visit, like the Reward Feedback card: rewards keep arriving while the experiment runs.
    this.experimentService.fetchRewardsReplayForExperiment();
    this.isLoading$ = this.experimentService.isLoadingRewardsReplay$;
    this.replayView$ = this.experimentService
      .getRewardsReplayForSelectedExperiment()
      .pipe(map((replay) => (replay ? buildRewardReplayView(replay) : null)));
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }

  onSelectedStepChange(index: number): void {
    this.selectedStepIndex = index;
  }

  /** The selected step, defaulting to the latest and clamped in case a refetch returned fewer steps. */
  effectiveStepIndex(view: RewardReplayView): number {
    return clampStepIndex(this.selectedStepIndex ?? view.steps.length - 1, view.steps.length);
  }
}
