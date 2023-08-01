import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ExperimentStatusComponent } from '../../components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from '../../components/modal/post-experiment-rule/post-experiment-rule.component';
import { NewExperimentComponent } from '../../components/modal/new-experiment/new-experiment.component';
import {
  EXPERIMENT_STATE,
  ExperimentVM,
  EXPERIMENT_SEARCH_KEY,
  ExperimentLevel,
  ExperimentConditionPayload,
} from '../../../../../core/experiments/store/experiments.model';
import { Observable, Subscription } from 'rxjs';
import { filter, withLatestFrom } from 'rxjs/operators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as clonedeep from 'lodash.clonedeep';
import { ExperimentStatePipeType } from '../../../../../shared/pipes/experiment-state.pipe';
import { DeleteComponent } from '../../../../../shared/components/delete/delete.component';
import { QueriesModalComponent } from '../../components/modal/queries-modal/queries-modal.component';
import { ExperimentEndCriteriaComponent } from '../../components/modal/experiment-end-criteria/experiment-end-criteria.component';
import { StateTimeLogsComponent } from '../../components/modal/state-time-logs/state-time-logs.component';
import { ExportModalComponent } from '../../components/modal/export-experiment/export-experiment.component';
import { FLAG_SEARCH_SORT_KEY } from '../../../../../core/feature-flags/store/feature-flags.model';
import { EnrollmentOverTimeComponent } from '../../components/enrollment-over-time/enrollment-over-time.component';
import { EXPERIMENT_TYPE, IMetricMetaData, PAYLOAD_TYPE } from 'upgrade_types';
import { MemberTypes } from '../../../../../core/segments/store/segments.model';
import { METRICS_JOIN_TEXT } from '../../../../../core/analysis/store/analysis.models';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import {
  FactorialConditionTableDataFromConditionPayload,
  SimpleExperimentPayloadTableRowData,
} from '../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';
// Used in view-experiment component only
enum DialogType {
  CHANGE_STATUS = 'Change status',
  CHANGE_POST_EXPERIMENT_RULE = 'Change post experiment rule',
  EDIT_EXPERIMENT = 'Edit Experiment',
  STATE_TIME_LOGS = 'State Time Logs',
  VIEW_PARTICIPANTS_DATA = 'View Participants Data',
}

type Participants = { participant_Type: string; participant_id: string };
type Factors = { factor: string; description: string; levels: ExperimentLevel[] };
type Metrics = { metric_Key: string[]; metric_Operation: string[]; metric_Name: string };

@Component({
  selector: 'home-view-experiment',
  templateUrl: './view-experiment.component.html',
  styleUrls: ['./view-experiment.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ViewExperimentComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  experiment: ExperimentVM;
  experimentSub: Subscription;
  experimentIdSub: Subscription;
  isLoadingExperimentDetailStats$: Observable<boolean>;
  isPollingExperimentDetailStats$: Observable<boolean>;
  factorsDataSource: Factors[];
  conditionDatasource: FactorialConditionTableDataFromConditionPayload[];
  expandedId: number = null;

  displayedConditionColumns: string[] = ['conditionCode', 'assignmentWeight', 'description'];
  displayedConditionColumnsFactorial: string[] = ['conditionCode', 'payload', 'assignmentWeight'];
  displayedPartitionColumns: string[] = ['partitionPoint', 'partitionId', 'excludeIfReached'];
  displayedPartitionColumnsFactorial: string[] = ['expandIcon', 'factorName', 'description'];
  displayedPartitionLevelColumnsFactorial = ['level', 'payload'];
  displayedPayloadConditionColumns: string[] = ['site', 'target', 'condition', 'payload'];
  displayedParticipantsColumns: string[] = ['participantsType', 'participantsId'];
  displayedMetricsColumns: string[] = ['metricsKey', 'metricsOperation', 'metricsName'];

  comparisonFns = [
    { value: '=', viewValue: 'equal' },
    { value: '<>', viewValue: 'not equal' },
  ];

  includeParticipants: Participants[] = [];
  excludeParticipants: Participants[] = [];
  displayMetrics: Metrics[] = [];
  simpleExperimentPayloadTableData: SimpleExperimentPayloadTableRowData[] = [];

  constructor(
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private _Activatedroute: ActivatedRoute
  ) {}

  get DialogType() {
    return DialogType;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  get ExperimentSearchKey() {
    return EXPERIMENT_SEARCH_KEY;
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }

  get isExperimentStateCancelled() {
    return this.experiment.state === EXPERIMENT_STATE.CANCELLED;
  }

  ngOnInit() {
    this.isLoadingExperimentDetailStats$ = this.experimentService.isLoadingExperimentDetailStats$;
    this.isPollingExperimentDetailStats$ = this.experimentService.isPollingExperimentDetailStats$;

    this.permissionsSub = this.authService.userPermissions$.subscribe((permission) => {
      this.permissions = permission;
    });

    this.experimentIdSub = this._Activatedroute.paramMap.subscribe((params) => {
      const experimentIdFromParams = params.get('experimentId');
      this.experimentService.fetchExperimentById(experimentIdFromParams);
    });

    this.experimentSub = this.experimentService.selectedExperiment$
      .pipe(
        withLatestFrom(
          this.isLoadingExperimentDetailStats$,
          this.isPollingExperimentDetailStats$,
          (experiment, isLoadingDetails, isPolling) => ({ experiment, isLoadingDetails, isPolling })
        ),
        filter(
          ({ isLoadingDetails, experiment }) =>
            !isLoadingDetails && !!experiment?.partitions?.length && !!experiment?.conditions?.length
        )
      )
      .subscribe(({ experiment, isPolling }) => {
        this.onExperimentChange(experiment, isPolling);
        this.loadParticipants();
        this.loadMetrics();

        if (experiment.type === EXPERIMENT_TYPE.SIMPLE) {
          this.loadPayloadTable(experiment);
        }
        if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
          this.createFactorialTableData();
          this.loadConditionTableData();
        }
      });

    if (this.experiment) {
      this.experimentService.fetchGroupAssignmentStatus(this.experiment.id);
      this.experimentService
        .groupSatisfied$(this.experiment.id)
        .subscribe((data) => (this.experiment.groupSatisfied = data));
    }
  }

  onExperimentChange(experiment: ExperimentVM, isPolling: boolean) {
    if (experiment.stat && experiment.stat.conditions) {
      this.experiment = experiment;
      this.experimentService.toggleDetailsPolling(experiment, isPolling);
    } else {
      this.experimentService.fetchExperimentDetailStat(experiment.id);
    }
  }

  loadPayloadTable(experiment: ExperimentVM) {
    if (experiment.type === EXPERIMENT_TYPE.SIMPLE) {
      this.simpleExperimentPayloadTableData =
        this.experimentDesignStepperService.createPayloadTableDataForViewExperiment(experiment);
    }
  }

  loadConditionTableData() {
    if (this.experiment) {
      this.conditionDatasource = [];
      this.experiment.conditions?.forEach((condition) => {
        let conditionPayload: ExperimentConditionPayload;
        this.experiment.conditionPayloads.forEach((payloadcondition) => {
          if (payloadcondition.parentCondition.id === condition.id) {
            conditionPayload = payloadcondition;
          }
        });

        this.conditionDatasource.push({
          id: condition.id,
          conditionCode: condition.conditionCode,
          payload: {
            type: PAYLOAD_TYPE.STRING,
            value: conditionPayload?.payload?.value,
          },
          assignmentWeight: condition.assignmentWeight.toString(),
        });
      });
    }
  }

  createFactorialTableData() {
    if (this.experiment) {
      this.factorsDataSource = [];
      this.experiment.factors?.forEach((factor) => {
        this.factorsDataSource.push({ factor: factor.name, description: factor.description, levels: factor.levels });
      });
    }
  }

  expandFactor(groupIndex: number) {
    this.expandedId = this.expandedId === groupIndex ? null : groupIndex;
  }

  loadParticipants() {
    if (this.experiment && this.experiment.experimentSegmentInclusion && this.experiment.experimentSegmentExclusion) {
      this.includeParticipants = [];
      this.excludeParticipants = [];
      this.experiment.experimentSegmentInclusion.segment.individualForSegment.forEach((id) => {
        this.includeParticipants.push({ participant_Type: MemberTypes.INDIVIDUAL, participant_id: id.userId });
      });
      this.experiment.experimentSegmentInclusion.segment.groupForSegment.forEach((group) => {
        this.includeParticipants.push({ participant_Type: group.type, participant_id: group.groupId });
      });
      this.experiment.experimentSegmentInclusion.segment.subSegments.forEach((id) => {
        this.includeParticipants.push({ participant_Type: MemberTypes.SEGMENT, participant_id: id.name });
      });
      this.experiment.experimentSegmentExclusion.segment.individualForSegment.forEach((id) => {
        this.excludeParticipants.push({ participant_Type: MemberTypes.INDIVIDUAL, participant_id: id.userId });
      });
      this.experiment.experimentSegmentExclusion.segment.groupForSegment.forEach((group) => {
        this.excludeParticipants.push({ participant_Type: group.type, participant_id: group.groupId });
      });
      this.experiment.experimentSegmentExclusion.segment.subSegments.forEach((id) => {
        this.excludeParticipants.push({ participant_Type: MemberTypes.SEGMENT, participant_id: id.name });
      });
    }
  }

  loadMetrics() {
    if (this.experiment) {
      this.displayMetrics = [];
      this.experiment.queries?.forEach((query) => {
        let key;
        if (query.metric.key) {
          key = query.metric.key;
        } else {
          key = query.metric;
        }
        // separating keys from metric
        const rootKey: string[] = key.split(METRICS_JOIN_TEXT);
        const statisticOperation: string[] = [query.query.operationType];
        if (rootKey.length > 1) {
          statisticOperation.push(query.repeatedMeasure);
          if (query.metric.type === IMetricMetaData.CATEGORICAL) {
            let compareFn;
            this.comparisonFns.forEach((comparisonFn) => {
              if (comparisonFn.value === query.query.compareFn) {
                compareFn = comparisonFn.viewValue;
              }
            });
            statisticOperation.push(compareFn);
            statisticOperation.push(query.query.compareValue);
          }
        }
        this.displayMetrics.push({
          metric_Key: rootKey,
          metric_Operation: statisticOperation,
          metric_Name: query.name,
        });
      });
    }
  }

  openDialog(dialogType: DialogType) {
    const dialogComponent =
      dialogType === DialogType.CHANGE_STATUS
        ? ExperimentStatusComponent
        : dialogType === DialogType.CHANGE_POST_EXPERIMENT_RULE
        ? PostExperimentRuleComponent
        : dialogType === DialogType.STATE_TIME_LOGS
        ? StateTimeLogsComponent
        : NewExperimentComponent;
    this.dialog.open(dialogComponent as any, {
      panelClass:
        dialogType === DialogType.STATE_TIME_LOGS
          ? 'state-time-logs-modal'
          : dialogType === DialogType.EDIT_EXPERIMENT
          ? 'new-experiment-modal'
          : 'experiment-general-modal',
      data: { experiment: clonedeep(this.experiment) },
      disableClose: dialogType === DialogType.EDIT_EXPERIMENT,
    });
  }

  searchExperiment(type: EXPERIMENT_SEARCH_KEY, value: FLAG_SEARCH_SORT_KEY) {
    this.experimentService.setSearchKey(type);
    this.experimentService.setSearchString(value);
    this.router.navigate(['/home']);
  }

  deleteExperiment() {
    const dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'delete-modal',
    });

    dialogRef.afterClosed().subscribe((isDeleteButtonClicked) => {
      if (isDeleteButtonClicked) {
        this.experimentService.deleteExperiment(this.experiment.id);
        // Add code of further actions after deleting experiment
      }
    });
  }

  openQueriesModal() {
    this.dialog.open(QueriesModalComponent, {
      panelClass: 'queries-modal',
      data: { experiment: clonedeep(this.experiment) },
    });
  }

  openExportModal() {
    this.dialog.open(ExportModalComponent, {
      panelClass: 'export-modal',
      data: { experiment: [clonedeep(this.experiment)] },
    });
  }

  updateEndingCriteria() {
    this.dialog.open(ExperimentEndCriteriaComponent, {
      panelClass: 'experiment-ending-criteria',
      data: { experiment: clonedeep(this.experiment) },
    });
  }

  viewParticipantsData() {
    this.dialog.open(EnrollmentOverTimeComponent, {
      panelClass: 'enrollment-over-time',
      data: { experiment: clonedeep(this.experiment) },
    });
  }

  getConditionCode(conditionId: string) {
    return this.experiment
      ? '(' + this.experiment.conditions.find((condition) => condition.id === conditionId).conditionCode + ')'
      : '';
  }

  toggleVerboseLogging(event) {
    this.experimentService.updateExperiment({ ...this.experiment, logging: event.checked });
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.permissionsSub.unsubscribe();
    this.experimentIdSub.unsubscribe();
    this.experimentService.endDetailStatsPolling();
  }
}
