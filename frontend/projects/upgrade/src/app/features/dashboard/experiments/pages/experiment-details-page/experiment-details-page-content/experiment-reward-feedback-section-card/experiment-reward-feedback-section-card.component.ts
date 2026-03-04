import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';
import { CommonSectionCardTitleHeaderComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-title-header/common-section-card-title-header.component';
import { CommonSectionCardActionButtonsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-action-buttons/common-section-card-action-buttons.component';
import { TSConfigurableRewardCountTableComponent } from './ts-configurable-reward-count-table/ts-configurable-reward-count-table.component';
import { AppState } from '../../../../../../../core/core.state';
import { Observable } from 'rxjs/internal/Observable';
import { actionFetchRewardsDataForExperiment } from '../../../../../../../core/experiments/store/experiments.actions';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { ExperimentRewardsSummary } from '../../../../../../../../../../../../types/src/Mooclet';

@Component({
  selector: 'app-experiment-reward-feedback-section-card',
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    TranslateModule,
    TSConfigurableRewardCountTableComponent,
  ],
  templateUrl: './experiment-reward-feedback-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentRewardFeedbackSectionCardComponent {
  @Input() isSectionCardExpanded = true;
  rewardsSummary$: Observable<ExperimentRewardsSummary>;
  isLoading$: Observable<boolean>;

  experimentService = inject(ExperimentService);

  ngOnInit(): void {
    // go ahead and refetch this each time instead of caching it in store, it is live data that could be updated
    this.experimentService.fetchRewardsDataForExperiment();
    this.rewardsSummary$ = this.experimentService.getRewardsSummaryForSelectedExperiment();
    this.isLoading$ = this.experimentService.isLoadingRewardsSummary$;
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
