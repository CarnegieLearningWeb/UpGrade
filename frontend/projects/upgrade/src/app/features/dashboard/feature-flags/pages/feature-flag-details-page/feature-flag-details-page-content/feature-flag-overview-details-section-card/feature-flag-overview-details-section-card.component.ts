import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS, FILTER_MODE, IMenuButtonItem } from 'upgrade_types';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';

import {
  CommonSectionCardOverviewDetailsComponent,
  KeyValueFormat,
} from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
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
    id: '38a29024-0edc-4a9e-83db-b966ae961304',
    name: 'Feature Flag 1',
    key: 'feature_flag_1',
    description: 'Feature Flag 1 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
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
  flagId: string;
  flagOverviewDetails: KeyValueFormat;

  menuButtonItems: IMenuButtonItem[] = [
    { name: 'Edit', disabled: false },
    { name: 'Delete', disabled: false },
  ];
  isSectionCardExpanded = true;

  constructor(private dialogService: DialogService) {}

  get FEATURE_FLAG_STATUS() {
    return FEATURE_FLAG_STATUS;
  }

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

  onSlideToggleChange(event: MatSlideToggleChange) {
    const slideToggleEvent = event.source;

    if (slideToggleEvent.checked) {
      this.openEnableConfirmModel();
    } else {
      this.openDisableConfirmModel();
    }

    // Note: we don't want the toggle to change state immediately because we have to pop a confirmation modal first, so we need override the default and flip it back
    slideToggleEvent.checked = !slideToggleEvent.checked;
  }

  openEnableConfirmModel(): void {
    this.dialogService.openEnableFeatureFlagConfirmModel({
      flagName: this.flagName,
      flagId: this.featureFlag.id,
    });
  }

  openDisableConfirmModel(): void {
    this.dialogService.openDisableFeatureFlagConfirmModel({
      flagName: this.flagName,
      flagId: this.featureFlag.id,
    });
  }

  onMenuButtonItemClick(event) {
    console.log('Menu button Clicked');
    console.log(event);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
