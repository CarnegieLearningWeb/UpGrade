import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { FeatureFlagInclusionsSectionCardComponent } from './feature-flag-inclusions-section-card/feature-flag-inclusions-section-card.component';
import { FeatureFlagExclusionsSectionCardComponent } from './feature-flag-exclusions-section-card/feature-flag-exclusions-section-card.component';
import { FeatureFlagExposuresSectionCardComponent } from './feature-flag-exposures-section-card/feature-flag-exposures-section-card.component';
import { FeatureFlagOverviewDetailsSectionCardComponent } from './feature-flag-overview-details-section-card/feature-flag-overview-details-section-card.component';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { FeatureFlag } from '../../../../../../core/feature-flags/store/feature-flags.model';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-feature-flag-details-page-content',
  imports: [
    CommonModule,
    CommonSectionCardListComponent,
    FeatureFlagInclusionsSectionCardComponent,
    FeatureFlagExclusionsSectionCardComponent,
    FeatureFlagExposuresSectionCardComponent,
    FeatureFlagOverviewDetailsSectionCardComponent,
    SharedModule,
  ],
  templateUrl: './feature-flag-details-page-content.component.html',
  styleUrl: './feature-flag-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagDetailsPageContentComponent implements OnInit, OnDestroy {
  isSectionCardExpanded = true;
  activeTabIndex$ = this.featureFlagsService.activeDetailsTabIndex$;
  featureFlag$: Observable<FeatureFlag>;

  featureFlagIdSub: Subscription;

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private router: Router,
    private route: ActivatedRoute,
    private segmentService: SegmentsService
  ) {}

  ngOnInit() {
    // Extract feature flag ID from route params
    const featureFlagIdFromRoute$ = this.route.paramMap.pipe(
      map((params) => params.get('flagId')),
      filter((flagId) => !!flagId)
    );

    // Wait for navigation completion
    const navigationComplete$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null)
    );

    // Combine both observables to ensure we only fetch after navigation completes
    // This will ensure no weird router behavior when navigating back and forth
    const flagId$ = combineLatest([featureFlagIdFromRoute$, navigationComplete$]).pipe(map(([flagId]) => flagId));

    this.featureFlagIdSub = flagId$.subscribe((flagId) => {
      this.featureFlagsService.fetchFeatureFlagById(flagId);
    });

    this.featureFlag$ = this.featureFlagsService.selectedFeatureFlag$;
    this.segmentService.fetchAllSegmentListOptions();
  }

  onSectionCardExpandChange(expanded: boolean) {
    this.isSectionCardExpanded = expanded;
  }

  ngOnDestroy() {
    this.featureFlagIdSub.unsubscribe();
  }
}
