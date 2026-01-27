import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonSectionCardListComponent } from '../../../../../../shared-standalone-component-lib/components';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ExperimentOverviewDetailsSectionCardComponent } from './experiment-overview-details-section-card/experiment-overview-details-section-card.component';
import { ExperimentDecisionPointsSectionCardComponent } from './experiment-decision-points-section-card/experiment-decision-points-section-card.component';
import { ExperimentConditionsSectionCardComponent } from './experiment-conditions-section-card/experiment-conditions-section-card.component';
import { ExperimentInclusionsSectionCardComponent } from './experiment-inclusions-section-card/experiment-inclusions-section-card.component';
import { ExperimentExclusionsSectionCardComponent } from './experiment-exclusions-section-card/experiment-exclusions-section-card.component';
import { ExperimentMetricsSectionCardComponent } from './experiment-metrics-section-card/experiment-metrics-section-card.component';
import { ExperimentEnrollmentDataSectionCardComponent } from './experiment-enrollment-data-section-card/experiment-enrollment-data-section-card.component';
import { ExperimentMetricsDataSectionCardComponent } from './experiment-metrics-data-section-card/experiment-metrics-data-section-card.component';
import { ExperimentPayloadsSectionCardComponent } from './experiment-payloads-section-card/experiment-payloads-section-card.component';
import { ExperimentRewardFeedbackSectionCardComponent } from './experiment-reward-feedback-section-card/experiment-reward-feedback-section-card.component';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, filter, startWith } from 'rxjs/operators';
import { Experiment, EXPERIMENT_STATE } from '../../../../../../core/experiments/store/experiments.model';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { MoocletExperimentHelperService } from '../../../../../../core/experiments/mooclet-helper.service';
import { ASSIGNMENT_ALGORITHM } from 'upgrade_types';

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
    ExperimentRewardFeedbackSectionCardComponent,
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
  experimentStateSub: Subscription;
  shouldShowRewardFeedback$: Observable<boolean>;
  private lastExperimentId?: string;
  private readonly dataTabStates = new Set<EXPERIMENT_STATE>([
    EXPERIMENT_STATE.ENROLLING,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    EXPERIMENT_STATE.CANCELLED,
  ]);

  constructor(
    private readonly experimentsService: ExperimentService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly segmentService: SegmentsService,
    private readonly moocletHelperService: MoocletExperimentHelperService
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
    this.experimentStateSub = this.experiment$
      .pipe(filter((experiment): experiment is Experiment => !!experiment))
      .subscribe((experiment) => {
        // Default the tab based on experiment state only when switching to a new experiment
        if (this.lastExperimentId !== experiment.id) {
          this.lastExperimentId = experiment.id;
          this.activeTabIndex = this.dataTabStates.has(experiment.state) ? 1 : 0;
        }
      });
    this.segmentService.fetchAllSegmentListOptions();

    // Determine if reward feedback card should be shown
    this.shouldShowRewardFeedback$ = this.experiment$.pipe(
      map((experiment) => {
        if (!experiment) {
          return false;
        }
        const isMoocletEnabled = this.moocletHelperService.isMoocletEnabled();
        const hasMoocletPolicyParameters = !!experiment.moocletPolicyParameters;
        const isTSConfigurable = experiment.assignmentAlgorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE;
        return isMoocletEnabled && hasMoocletPolicyParameters && isTSConfigurable;
      })
    );
  }

  onSectionCardExpandChange(expanded: boolean): void {
    this.isSectionCardExpanded = expanded;
  }

  onTabChange(tabIndex: number): void {
    this.activeTabIndex = tabIndex;
  }

  ngOnDestroy() {
    this.experimentIdSub.unsubscribe();
    this.experimentStateSub.unsubscribe();
  }
}
