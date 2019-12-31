import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material';
import { ExperimentStatusComponent } from '../../components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from '../../components/modal/post-experiment-rule/post-experiment-rule.component';
import { NewExperimentComponent } from '../../components/modal/new-experiment/new-experiment.component';
import { Experiment } from '../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';

enum DialogType {
  CHANGE_STATUS = 'Change status',
  CHANGE_POST_EXPERIMENT_RULE = 'Change post experiment rule',
  EDIT_EXPERIMENT = 'Edit Experiment'
}

@Component({
  selector: 'app-view-experiment',
  templateUrl: './view-experiment.component.html',
  styleUrls: ['./view-experiment.component.scss']
})
export class ViewExperimentComponent implements OnInit, OnDestroy {

  experiment: Experiment;
  experimentSub: Subscription;
  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.experimentSub = this.experimentService.selectedExperiment$.subscribe(experiment => {
      this.experiment = experiment;
    });
  }

  openDialog(dialogType: DialogType, stepperIndex?: number) {
    const dialogComponent =
      dialogType === DialogType.CHANGE_STATUS
        ? ExperimentStatusComponent
        : (dialogType === DialogType.CHANGE_POST_EXPERIMENT_RULE ?  PostExperimentRuleComponent : NewExperimentComponent);
    const dialogRef = this.dialog.open(dialogComponent as any, {
      width: '50%',
      data: { experiment: this.experiment, stepperIndex: stepperIndex || 0 }
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  get DialogType() {
    return DialogType;
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
  }
}
