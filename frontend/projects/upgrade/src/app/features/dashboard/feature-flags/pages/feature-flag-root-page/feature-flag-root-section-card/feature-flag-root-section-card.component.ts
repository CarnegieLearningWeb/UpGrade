import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  CommonSectionCardComponent,
  CommonSectionCardSearchHeaderComponent,
} from '../../../../../../shared-standalone-component-lib/components';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-feature-flag-root-section-card',
  standalone: true,
  imports: [
    CommonSectionCardComponent,
    CommonSectionCardSearchHeaderComponent,
    AsyncPipe,
    JsonPipe,
    NgIf,
    MatProgressSpinnerModule,
  ],
  templateUrl: './feature-flag-root-section-card.component.html',
  styleUrl: './feature-flag-root-section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagRootSectionCardComponent {
  isLoadingFeatureFlags$ = this.featureFlagService.isLoadingFeatureFlags$; // TBD if this will still be needed for for something
  allFeatureFlags$ = this.featureFlagService.allFeatureFlags$;
  isAllFlagsFetched$ = this.featureFlagService.isAllFlagsFetched$;

  constructor(private featureFlagService: FeatureFlagsService) {}

  ngOnInit() {
    this.featureFlagService.fetchFeatureFlags();
  }

  onSearch(searchString: string) {
    console.log('searchString', searchString);
    // this.featureFlagService.setSearchString(searchString);
  }
}
