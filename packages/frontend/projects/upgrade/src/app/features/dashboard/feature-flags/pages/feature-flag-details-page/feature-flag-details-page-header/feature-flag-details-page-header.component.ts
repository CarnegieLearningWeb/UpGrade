import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonDetailsPageHeaderComponent } from '@shared-component-lib';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-feature-flag-details-page-header',
  imports: [CommonDetailsPageHeaderComponent, CommonModule],
  templateUrl: './feature-flag-details-page-header.component.html',
  styleUrl: './feature-flag-details-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageHeaderComponent {
  // Suppress the cached flag name while the details page shows its error state,
  // so the breadcrumb doesn't display a stale name next to "not found"
  detailsName$: Observable<string> = combineLatest([
    this.featureFlagService.selectedFeatureFlag$,
    this.featureFlagService.featureFlagDetailsPageError$,
  ]).pipe(map(([featureFlag, detailsPageError]) => (detailsPageError ? '' : featureFlag?.name ?? '')));

  constructor(private featureFlagService: FeatureFlagsService) {}
}
