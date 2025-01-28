import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { ParticipantListRowActionEvent } from '../../../../../../../../core/feature-flags/store/feature-flags.model';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FEATURE_FLAG_LIST_FILTER_MODE } from 'upgrade_types';

@Component({
    selector: 'app-feature-flag-exclusions-table',
    templateUrl: './feature-flag-exclusions-table.component.html',
    styleUrl: './feature-flag-exclusions-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule]
})
export class FeatureFlagExclusionsTableComponent {
  @Input() actionsDisabled?: boolean = false;
  tableType = FEATURE_FLAG_LIST_FILTER_MODE.EXCLUSION;
  dataSource$ = this.featureFlagService.selectFeatureFlagExclusions$;
  isLoading$ = this.featureFlagService.isLoadingSelectedFeatureFlag$;
  @Output() rowAction = new EventEmitter<ParticipantListRowActionEvent>();

  constructor(private featureFlagService: FeatureFlagsService) {}

  onRowAction(event: ParticipantListRowActionEvent): void {
    this.rowAction.emit(event);
  }
}
