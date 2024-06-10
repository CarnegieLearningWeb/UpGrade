import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { FeatureFlagInclusionsSectionCardComponent } from './feature-flag-inclusions-section-card/feature-flag-inclusions-section-card.component';
import { FeatureFlagExclusionsSectionCardComponent } from './feature-flag-exclusions-section-card/feature-flag-exclusions-section-card.component';
import { FeatureFlagExposuresSectionCardComponent } from './feature-flag-exposures-section-card/feature-flag-exposures-section-card.component';
import { FeatureFlagOverviewDetailsSectionCardComponent } from './feature-flag-overview-details-section-card/feature-flag-overview-details-section-card.component';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { filter, Subscription } from 'rxjs';
import { FeatureFlag } from '../../../../../../core/feature-flags/store/feature-flags.model';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-feature-flag-details-page-content',
  standalone: true,
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
  activeTabIndex$ = this.featureFlagsService.activeDetailsTabIndex$;
  featureFlag: FeatureFlag;
  featureFlagSub: Subscription;
  featureFlagIdSub: Subscription;

  constructor(
    private featureFlagsService: FeatureFlagsService,
    private _Activatedroute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef
  ) {}
  ngOnInit() {
    this.featureFlagIdSub = this._Activatedroute.paramMap.subscribe((params) => {
      const featureFlagIdFromParams = params.get('flagId');
      this.featureFlagsService.fetchFeatureFlagById(featureFlagIdFromParams);
    });

    this.featureFlagSub = this.featureFlagsService.selectedFeatureFlag$
      .pipe(filter((featureFlag) => !!featureFlag))
      .subscribe((featureFlag) => {
        this.featureFlag = featureFlag;
        this.changeDetectorRef.detectChanges();
      });
  }
  ngOnDestroy() {
    this.featureFlagSub.unsubscribe();
    this.featureFlagIdSub.unsubscribe();
  }
}
