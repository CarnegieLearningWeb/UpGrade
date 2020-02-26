import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material';
import { ExperimentStatusComponent } from '../../components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from '../../components/modal/post-experiment-rule/post-experiment-rule.component';
import { NewExperimentComponent } from '../../components/modal/new-experiment/new-experiment.component';
import { EXPERIMENT_STATE, ExperimentVM } from '../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Used in view-experiment component only
enum DialogType {
  CHANGE_STATUS = 'Change status',
  CHANGE_POST_EXPERIMENT_RULE = 'Change post experiment rule',
  EDIT_EXPERIMENT = 'Edit Experiment'
}

@Component({
  selector: 'home-view-experiment',
  templateUrl: './view-experiment.component.html',
  styleUrls: ['./view-experiment.component.scss']
})
export class ViewExperimentComponent implements OnInit, OnDestroy {

  experiment: ExperimentVM;
  experimentSub: Subscription;
  displayedConditionColumns: string[] = ['no', 'conditionCode', 'assignmentWeight', 'description'];
  displayedPartitionColumns: string[] = ['no', 'partitionPoint', 'partitionId'];

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.experimentSub = this.experimentService.selectedExperiment$.pipe(
      filter(experiment => !!experiment)
    ).subscribe(experiment => {
      this.experiment = experiment;
    });
  }

  openDialog(dialogType: DialogType) {
    const dialogComponent =
      dialogType === DialogType.CHANGE_STATUS
        ? ExperimentStatusComponent
        : (dialogType === DialogType.CHANGE_POST_EXPERIMENT_RULE ?  PostExperimentRuleComponent : NewExperimentComponent);
    const dialogRef = this.dialog.open(dialogComponent as any, {
      width: '55%',
      data: { experiment: this.experiment }
    });

    dialogRef.afterClosed().subscribe(() => {
    });
  }

  deleteExperiment(experimentId: string) {
    this.experimentService.deleteExperiment(experimentId);
  }

  get DialogType() {
    return DialogType;
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }
}
