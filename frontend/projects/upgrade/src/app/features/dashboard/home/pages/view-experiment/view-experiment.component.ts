import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material/dialog';
import { ExperimentStatusComponent } from '../../components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from '../../components/modal/post-experiment-rule/post-experiment-rule.component';
import { NewExperimentComponent } from '../../components/modal/new-experiment/new-experiment.component';
import {
  EXPERIMENT_STATE,
  ExperimentVM,
  EXPERIMENT_SEARCH_KEY
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

// Used in view-experiment component only
enum DialogType {
  CHANGE_STATUS = 'Change status',
  CHANGE_POST_EXPERIMENT_RULE = 'Change post experiment rule',
  EDIT_EXPERIMENT = 'Edit Experiment',
  STATE_TIME_LOGS = 'State Time Logs'
}

@Component({
  selector: 'home-view-experiment',
  templateUrl: './view-experiment.component.html',
  styleUrls: ['./view-experiment.component.scss']
})
export class ViewExperimentComponent implements OnInit, OnDestroy {
  permissions: UserPermission;
  permissionsSub: Subscription;
  experiment: ExperimentVM;
  experimentSub: Subscription;
  experimentIdSub: Subscription;
  isLoadingExperimentDetailStats$: Observable<boolean>;
  isPollingExperimentDetailStats$: Observable<boolean>;

  displayedConditionColumns: string[] = ['conditionCode', 'assignmentWeight', 'description'];
  displayedPartitionColumns: string[] = ['partitionPoint', 'partitionId', 'excludeIfReached'];

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private _Activatedroute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isLoadingExperimentDetailStats$ = this.experimentService.isLoadingExperimentDetailStats$;
    this.isPollingExperimentDetailStats$ = this.experimentService.isPollingExperimentDetailStats$;

    this.permissionsSub = this.authService.userPermissions$.subscribe(permission => {
      this.permissions = permission;
    });

    this.experimentIdSub = this._Activatedroute.paramMap.subscribe(params => { 
      const experimentIdFromParams = params.get('experimentId');
      this.experimentService.fetchExperimentById(experimentIdFromParams);
    });

    this.experimentSub = this.experimentService.selectedExperiment$      
      .pipe(
        withLatestFrom(
          this.isLoadingExperimentDetailStats$,
          this.isPollingExperimentDetailStats$,
          (experiment, isLoadingDetails, isPolling) => {
            return { experiment, isLoadingDetails, isPolling }
          }
        ),
        filter(({ isLoadingDetails }) => !isLoadingDetails),
      ).subscribe(({ experiment, isPolling }) => {
        this.onExperimentChange(experiment, isPolling);
      })

      if (this.experiment) {
        this.experimentService.fetchGroupAssignmentStatus(this.experiment.id);
        this.experimentService.groupSatisfied$(this.experiment.id).subscribe(data => this.experiment.groupSatisfied = data);
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

  openDialog(dialogType: DialogType) {
    const dialogComponent =
      dialogType === DialogType.CHANGE_STATUS
        ? ExperimentStatusComponent
        : dialogType === DialogType.CHANGE_POST_EXPERIMENT_RULE
        ? PostExperimentRuleComponent
        : dialogType === DialogType.STATE_TIME_LOGS
        ? StateTimeLogsComponent
        : NewExperimentComponent;
    const dialogRef = this.dialog.open(dialogComponent as any, {
      panelClass: dialogType === DialogType.STATE_TIME_LOGS ? 'state-time-logs-modal' :
                  dialogType === DialogType.EDIT_EXPERIMENT ? 'new-experiment-modal' :
                  'experiment-general-modal',
      data: { experiment: clonedeep(this.experiment) },
      disableClose : dialogType === DialogType.EDIT_EXPERIMENT
    });

    dialogRef.afterClosed().subscribe(() => {});
  }

  searchExperiment(type: EXPERIMENT_SEARCH_KEY, value: FLAG_SEARCH_SORT_KEY) {
    this.experimentService.setSearchKey(type);
    this.experimentService.setSearchString(value);
    this.router.navigate(['/home']);
  }

  deleteExperiment() {
    const dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: 'delete-modal'
    });

    dialogRef.afterClosed().subscribe(isDeleteButtonClicked => {
      if (isDeleteButtonClicked) {
        this.experimentService.deleteExperiment(this.experiment.id);
        // Add code of further actions after deleting experiment
      }
    });
  }

  openQueriesModal() {
    const dialogRef = this.dialog.open(QueriesModalComponent, {
      panelClass: 'queries-modal',
      data: { experiment: clonedeep(this.experiment) }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after opening query modal
    });
  }

  openExportModal() {
    const dialogRef = this.dialog.open(ExportModalComponent, {
      panelClass: 'export-modal',
      data: { experiment: [clonedeep(this.experiment)] }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after opening query modal
    });
  }

  updateEndingCriteria() {
    const dialogRef = this.dialog.open(ExperimentEndCriteriaComponent, {
      panelClass: 'experiment-ending-criteria',
      data: { experiment: clonedeep(this.experiment) }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Add code of further actions after opening query modal
    });
  }

  getConditionCode(conditionId: string) {
    return !!this.experiment ? '(' + this.experiment.conditions.find(condition => condition.id === conditionId).conditionCode + ')' : '';
  }

  get DialogType() {
    return DialogType;
  }

  toggleVerboseLogging(event) {
    this.experimentService.updateExperiment({...this.experiment, logging: event.checked })
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
    this.permissionsSub.unsubscribe();
    this.experimentIdSub.unsubscribe();
    this.experimentService.endDetailStatsPolling();
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
}
