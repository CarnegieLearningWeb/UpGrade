import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { CommonSectionCardComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card/common-section-card.component';
import { CommonSectionCardTitleHeaderComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-title-header/common-section-card-title-header.component';
import { CommonSectionCardActionButtonsComponent } from '../../../../../../../shared-standalone-component-lib/components/common-section-card-action-buttons/common-section-card-action-buttons.component';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';
import { map } from 'rxjs';
import { ExperimentVM } from '../../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../../core/experiments/experiments.service';
import { MoocletExperimentHelperService } from '../../../../../../../core/experiments/mooclet-helper.service';
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

  selectedExperiment$ = this.experimentService.selectedExperiment$;

  shouldDisplayCard$ = this.selectedExperiment$.pipe(
    map((experiment: ExperimentVM) => {
      if (!experiment) {
        return false;
      }

      const isMoocletEnabled = this.moocletHelperService.isMoocletEnabled();
      const hasMoocletPolicyParameters = !!experiment.moocletPolicyParameters;
      const isTSConfigurable = experiment.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE;

      return isMoocletEnabled && hasMoocletPolicyParameters && isTSConfigurable;
    })
  );

  currentPosteriorsTableData$ = this.store.select(selectCurrentPosteriorsTableData);

  constructor(
    private readonly experimentService: ExperimentService,
    private readonly moocletHelperService: MoocletExperimentHelperService,
    private readonly store: Store<AppState>
  ) {}

  onSectionCardExpandChange(isSectionCardExpanded: boolean): void {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
