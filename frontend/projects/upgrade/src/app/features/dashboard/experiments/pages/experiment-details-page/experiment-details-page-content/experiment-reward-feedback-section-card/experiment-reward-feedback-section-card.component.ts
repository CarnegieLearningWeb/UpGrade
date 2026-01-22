import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';
import { CommonSectionCardTitleHeaderComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-title-header/common-section-card-title-header.component';
import { CommonSectionCardActionButtonsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-action-buttons/common-section-card-action-buttons.component';
import { TSConfigurableRewardCountTableComponent } from './ts-configurable-reward-count-table/ts-configurable-reward-count-table.component';
import { AppState } from '../../../../../../../core/core.state';
import { selectCurrentPosteriorsTableData } from '../../../../../../../core/experiments/store/experiments.selectors';

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

  currentPosteriorsTableData$ = this.store.select(selectCurrentPosteriorsTableData);

  constructor(private readonly store: Store<AppState>) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
