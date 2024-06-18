import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FeatureFlagsService } from '../../../../../../../../core/feature-flags/feature-flags.service';
import { CommonDetailsParticipantListTableComponent } from '../../../../../../../../shared-standalone-component-lib/components/common-details-participant-list-table/common-details-participant-list-table.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-feature-flag-exclusions-table',
  standalone: true,
  templateUrl: './feature-flag-exclusions-table.component.html',
  styleUrl: './feature-flag-exclusions-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonDetailsParticipantListTableComponent, CommonModule, TranslateModule],
})
export class FeatureFlagExclusionsTableComponent {
  @Input() dataSource$ = this.featureFlagService.selectFeatureFlagExclusions$;
  isLoading$ = this.featureFlagService.isLoadingFeatureFlags$;

  constructor(private featureFlagService: FeatureFlagsService) {}
}
