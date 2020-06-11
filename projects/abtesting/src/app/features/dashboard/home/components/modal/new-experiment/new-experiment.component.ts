import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM
} from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
})
export class NewExperimentComponent implements OnInit {
  newExperimentData: any = {};
  selectedStepperIndex = 0;
  experimentInfo: ExperimentVM;
  animationCompletedIndex: Number;
  @ViewChild('stepper', { static: false }) stepper: any;
  constructor(
    private dialogRef: MatDialogRef<NewExperimentComponent>,
    private experimentService: ExperimentService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.experimentInfo = this.data.experiment;
    }
  }

  ngOnInit() {
    // Used to fetch context only once
    this.experimentService.fetchExperimentContext();
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
          ...formData
        };
        this.stepper.next();
        if (path === NewExperimentPaths.POST_EXPERIMENT_RULE) {
          this.newExperimentData.queries = [];
          this.experimentService.createNewExperiment(this.newExperimentData);
          this.onNoClick();
        }
        break;
      case NewExperimentDialogEvents.UPDATE_EXPERIMENT:
        this.newExperimentData = {
          ...this.experimentInfo,
          ...this.newExperimentData,
          ...formData
        };
        this.experimentService.updateExperiment(this.newExperimentData);
        this.onNoClick();
        break;
    }
  }

  stepChanged(event) {
    this.selectedStepperIndex = event.selectedIndex;
  }

  animationDone() {
    this.animationCompletedIndex = this.selectedStepperIndex;
  }
}
