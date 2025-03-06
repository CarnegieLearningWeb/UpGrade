import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM,
  POST_EXPERIMENT_RULE,
} from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentDesignStepperService } from '../../../../../../core/experiment-design-stepper/experiment-design-stepper.service';

@Component({
  selector: 'home-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
  standalone: false,
})
export class NewExperimentComponent implements OnInit {
  @ViewChild('stepper') stepper: any;
  newExperimentData: any = {};
  selectedStepperIndex = 0;
  experimentInfo: ExperimentVM;
  animationCompletedIndex: number;
  currentContext: string;
  isContextChanged = false;
  currentExperimentType: string;
  isExperimentTypeChanged = false;

  constructor(
    private dialogRef: MatDialogRef<NewExperimentComponent>,
    private experimentService: ExperimentService,
    private experimentDesignStepperService: ExperimentDesignStepperService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.experimentInfo = this.data.experiment;
    }
  }

  ngOnInit() {
    // Used to fetch contextMetaData only once
    this.experimentService.fetchContextMetaData();
  }

  ngOnDestroy() {
    this.experimentDesignStepperService.clearAssignmentAlgorithm();
    this.experimentDesignStepperService.clearFactorialDesignStepperData();
    this.experimentDesignStepperService.clearSimpleExperimentDesignStepperData();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getExperimentData(event: NewExperimentDialogData) {
    const { type, formData, path } = event;
    switch (type) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.onNoClick();
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        this.newExperimentData = {
          ...this.newExperimentData,
          ...formData,
        };

        if (!this.currentContext && this.experimentInfo) {
          this.currentContext = this.experimentInfo.context[0];
        }

        this.isContextChanged = this.currentContext !== this.newExperimentData.context[0];

        this.currentContext = this.newExperimentData.context[0];

        if (!this.currentExperimentType && this.experimentInfo) {
          this.currentExperimentType = this.experimentInfo.type;
        }

        this.isExperimentTypeChanged = this.currentExperimentType !== this.newExperimentData.type;

        this.currentExperimentType = this.newExperimentData.type;

        this.stepper.next();
        if (path === NewExperimentPaths.POST_EXPERIMENT_RULE) {
          this.experimentService.createNewExperiment(this.newExperimentData);
          this.onNoClick();
        }

        break;
      case NewExperimentDialogEvents.UPDATE_EXPERIMENT:
        this.onNoClick();
      // TODO: eslint wants a break statement here, not sure on usage
      // eslint-disable-next-line no-fallthrough
      case NewExperimentDialogEvents.SAVE_DATA:
        this.newExperimentData = {
          ...this.experimentInfo,
          ...this.newExperimentData,
          ...formData,
        };
        this.checkPostExperimentRule();
        this.experimentService.updateExperiment(this.newExperimentData);
        this.onNoClick();
        break;
    }
  }

  checkPostExperimentRule() {
    if (this.newExperimentData.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && this.newExperimentData.revertTo) {
      const conditionToSet = this.newExperimentData.conditions.filter((condition) => {
        return condition.id === this.newExperimentData.revertTo;
      });
      if (!conditionToSet.length) {
        this.newExperimentData.postExperimentRule = POST_EXPERIMENT_RULE.CONTINUE;
      }
    }
  }

  stepChanged(event) {
    this.selectedStepperIndex = event.selectedIndex;
  }

  animationDone() {
    this.animationCompletedIndex = this.selectedStepperIndex;
  }
}
