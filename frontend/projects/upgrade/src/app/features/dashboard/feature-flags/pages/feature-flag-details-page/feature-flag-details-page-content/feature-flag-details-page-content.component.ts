import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { FeatureFlagInclusionsSectionCardComponent } from './feature-flag-inclusions-section-card/feature-flag-inclusions-section-card.component';
import { FeatureFlagExclusionsSectionCardComponent } from './feature-flag-exclusions-section-card/feature-flag-exclusions-section-card.component';
import { FeatureFlagExposuresSectionCardComponent } from './feature-flag-exposures-section-card/feature-flag-exposures-section-card.component';
import { FeatureFlagOverviewDetailsSectionCardComponent } from './feature-flag-overview-details-section-card/feature-flag-overview-details-section-card.component';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { Observable, Subscription } from 'rxjs';
import { FeatureFlag } from '../../../../../../core/feature-flags/store/feature-flags.model';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

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
    private _Activatedroute: ActivatedRoute,
    private segmentService: SegmentsService
  ) {}
  ngOnInit() {
    this.featureFlagIdSub = this._Activatedroute.paramMap.subscribe((params) => {
      const featureFlagIdFromParams = params.get('flagId');
      this.featureFlagsService.fetchFeatureFlagById(featureFlagIdFromParams);
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
