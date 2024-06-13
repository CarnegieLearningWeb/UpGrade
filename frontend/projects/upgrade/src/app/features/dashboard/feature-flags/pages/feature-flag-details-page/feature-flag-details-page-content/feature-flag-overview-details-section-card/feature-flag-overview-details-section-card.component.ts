import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  CommonSectionCardActionButtonsComponent,
  CommonSectionCardComponent,
  CommonSectionCardTitleHeaderComponent,
} from '../../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagOverviewDetailsFooterComponent } from './feature-flag-overview-details-footer/feature-flag-overview-details-footer.component';
import { FeatureFlag } from '../../../../../../../core/feature-flags/store/feature-flags.model';
import { FEATURE_FLAG_STATUS, IMenuButtonItem } from 'upgrade_types';
import { CommonModule } from '@angular/common';
import {
  CommonSectionCardOverviewDetailsComponent,
  KeyValueFormat,
} from '../../../../../../../shared-standalone-component-lib/components/common-section-card-overview-details/common-section-card-overview-details.component';
import { DialogService } from '../../../../../../../shared/services/common-dialog.service';
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
  flagName: string;
  flagId: string;
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

  constructor(private dialogService: DialogService) {}

  ngOnInit() {
    this.flagName = this.data.name;
    this.flagId = this.data.id;
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
    if (event === 'Delete') {
      this.dialogService.openDeleteFeatureFlagModal(this.flagName, this.flagId);
    } else if (event === 'Edit') {
      console.log('Menu button Clicked');
      console.log(event);
    }
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    this.isSectionCardExpanded = isSectionCardExpanded;
  }
}
