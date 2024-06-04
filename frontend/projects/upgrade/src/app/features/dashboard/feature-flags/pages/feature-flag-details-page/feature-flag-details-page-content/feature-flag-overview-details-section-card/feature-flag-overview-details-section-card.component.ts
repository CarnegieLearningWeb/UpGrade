import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-feature-flag-overview-details-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    FeatureFlagOverviewDetailsFooterComponent,
  ],
  templateUrl: './feature-flag-overview-details-section-card.component.html',
  styleUrl: './feature-flag-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewDetailsSectionCardComponent {
  //temp mock data
  featureFlag: FeatureFlag = {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '1',
    name: 'Feature Flag 1',
    key: 'feature_flag_1',
    description: 'Feature Flag 1 Description',
    status: FEATURE_FLAG_STATUS.DISABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context1', 'context2'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  };
  flagName: string;
  flagHeaderSubtitle: string;
  flagCreatedAt: string;
  flagUpdatedAt: string;
  flagStatus: FEATURE_FLAG_STATUS;

  constructor(private featureFlagService: FeatureFlagsService) {}

  ngOnInit() {
    this.flagName = this.featureFlag.name;
    this.flagCreatedAt = this.featureFlag.createdAt;
    this.flagUpdatedAt = this.featureFlag.updatedAt;
    this.flagStatus = this.featureFlag.status;
  }

  viewLogsClicked(event) {
    console.log('viewLogs Clicked');
    console.log(event);
  }
}
