import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ExperimentOverviewDetailsSectionCardComponent } from './experiment-overview-details-section-card/experiment-overview-details-section-card.component';
import { ExperimentDecisionPointsSectionCardComponent } from './experiment-decision-points-section-card/experiment-decision-points-section-card.component';
import { ExperimentConditionsSectionCardComponent } from './experiment-conditions-section-card/experiment-conditions-section-card.component';
import { ExperimentPayloadsSectionCardComponent } from './experiment-payloads-section-card/experiment-payloads-section-card.component';
import { ExperimentInclusionsSectionCardComponent } from './experiment-inclusions-section-card/experiment-inclusions-section-card.component';
import { ExperimentExclusionsSectionCardComponent } from './experiment-exclusions-section-card/experiment-exclusions-section-card.component';
import { ExperimentMetricsSectionCardComponent } from './experiment-metrics-section-card/experiment-metrics-section-card.component';
import { ExperimentEnrollmentDataSectionCardComponent } from './experiment-enrollment-data-section-card/experiment-enrollment-data-section-card.component';
import { ExperimentMetricsDataSectionCardComponent } from './experiment-metrics-data-section-card/experiment-metrics-data-section-card.component';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, filter, startWith } from 'rxjs/operators';
import { Experiment } from '../../../../../../core/experiments/store/experiments.model';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-experiment-details-page-content',
  imports: [
    CommonModule,
    SharedModule,
    CommonSectionCardListComponent,
    ExperimentOverviewDetailsSectionCardComponent,
    ExperimentDecisionPointsSectionCardComponent,
    ExperimentConditionsSectionCardComponent,
    ExperimentPayloadsSectionCardComponent,
    ExperimentInclusionsSectionCardComponent,
    ExperimentExclusionsSectionCardComponent,
    ExperimentMetricsSectionCardComponent,
    ExperimentEnrollmentDataSectionCardComponent,
    ExperimentMetricsDataSectionCardComponent,
  ],
  templateUrl: './experiment-details-page-content.component.html',
  styleUrl: './experiment-details-page-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentDetailsPageContentComponent implements OnInit, OnDestroy {
  isSectionCardExpanded = true;
  activeTabIndex = 0; // 0 for Design, 1 for Data
  experiment$: Observable<Experiment>;
  experimentIdSub: Subscription;

  constructor(
    private experimentsService: ExperimentService,
    private router: Router,
    private route: ActivatedRoute,
    private segmentService: SegmentsService
  ) {}

  ngOnInit() {
    // Extract experiment ID from route params
    const experimentIdFromRoute$ = this.route.paramMap.pipe(
      map((params) => params.get('experimentId')),
      filter((experimentId) => !!experimentId)
    );

    // Wait for navigation completion
    const navigationComplete$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null)
    );

    // Combine both observables to ensure we only fetch after navigation completes
    // This will ensure no weird router behavior when navigating back and forth
    const experimentId$ = combineLatest([experimentIdFromRoute$, navigationComplete$]).pipe(
      map(([experimentId]) => experimentId)
    );

    this.experimentIdSub = experimentId$.subscribe((experimentId) => {
      this.experimentsService.fetchExperimentById(experimentId);
    });

    this.experiment$ = this.experimentsService.selectedExperiment$;
    this.segmentService.fetchAllSegmentListOptions();
  }

  onSectionCardExpandChange(expanded: boolean): void {
    this.isSectionCardExpanded = expanded;
  }

  onTabChange(tabIndex: number): void {
    this.activeTabIndex = tabIndex;
  }

  ngOnDestroy() {
    this.experimentIdSub.unsubscribe();
  }
}
