import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
  CommonSectionCardActionButtonsComponent,
} from '../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';

@Component({
  selector: 'app-feature-flag-root-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    CommonSectionCardActionButtonsComponent,
    AsyncPipe,
    JsonPipe,
    NgIf,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './feature-flag-root-section-card.component.html',
  styleUrl: './feature-flag-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardComponent {
  isLoadingFeatureFlags$ = this.featureFlagService.isLoadingFeatureFlags$; // TBD if this will still be needed for for something
  allFeatureFlags$ = this.featureFlagService.allFeatureFlags$;
  isAllFlagsFetched$ = this.featureFlagService.isAllFlagsFetched$;

  menuButtonItems: IMenuButtonItem[] = [
    {
      name: this.translateService.instant('feature-flags.import-feature-flag.text'),
      disabled: false
    },
    {
      name: this.translateService.instant('feature-flags.export-all-feature-flags.text'),
      disabled: true
    }
  ];

  constructor(
    private featureFlagService: FeatureFlagsService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.featureFlagService.fetchFeatureFlags();
  }

  onSearch(searchString: string) {
    console.log('searchString', searchString);
    // this.featureFlagService.setSearchString(searchString);
  }

  onAddFeatureFlagButtonClick() {
    console.log('onAddFeatureFlagButtonClick');
  }

  onMenuButtonItemClick(menuButtonItemName: string) {
    console.log('onMenuButtonItemClick:', menuButtonItemName);
  }

  onSectionCardExpandChange(isSectionCardExpanded: boolean) {
    console.log('onSectionCardExpandChange:', isSectionCardExpanded);
  }

}
