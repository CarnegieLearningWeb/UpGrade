import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS, FILTER_MODE, IMenuButtonItem } from 'upgrade_types';
import { FeatureFlagsService } from '../../../../../../../core/feature-flags/feature-flags.service';
import { CommonModule } from '@angular/common';
import {
  CommonSectionCardOverviewDetailsComponent,
  KeyValueFormat,
} from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
@Component({
  selector: 'app-feature-flag-overview-details-section-card',
  standalone: true,
  imports: [
    CommonModule,
    CommonSectionCardComponent,
    CommonSectionCardTitleHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    CommonSectionCardOverviewDetailsComponent,
    FeatureFlagOverviewDetailsFooterComponent,
  ],
  templateUrl: './feature-flag-overview-details-section-card.component.html',
  styleUrl: './feature-flag-overview-details-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagOverviewDetailsSectionCardComponent {
  @Input() data: FeatureFlag;
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
  flagOverviewDetails: KeyValueFormat;

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];
  isSectionCardExpanded = true;

  constructor(private featureFlagService: FeatureFlagsService) {}

  ngOnInit() {
    this.flagName = this.data.name;
    this.flagCreatedAt = this.data.createdAt;
    this.flagUpdatedAt = this.data.updatedAt;
    this.flagStatus = this.data.status;
    this.flagOverviewDetails = {
      ['Key']: this.data.key,
      ['Description']: this.data.description,
      ['App Context']: this.data.context[0],
      ['Tags']: this.data.tags,
    };
  }

  viewLogsClicked(event) {
    console.log('viewLogs Clicked');
    console.log(event);
  }

  onSlideToggleChange(event) {
    console.log('on Slide Toggle Clicked');
    console.log(event);
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
