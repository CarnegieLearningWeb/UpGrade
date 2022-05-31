import { Component, Inject, ViewChild, OnInit } from '@angular/core';
import { MatDialogRef, MatSnackBar, MAT_DIALOG_DATA } from '@angular/material';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM
} from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';

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
  currentContext: string;
  isContextChanged: boolean = false;
  @ViewChild('stepper', { static: false }) stepper: any;
  constructor(
    private dialogRef: MatDialogRef<NewExperimentComponent>,
    private experimentService: ExperimentService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    if (this.data) {
      this.experimentInfo = this.data.experiment;
    }
  }

  ngOnInit() {
    // Used to fetch contextMetaData only once
    this.experimentService.fetchContextMetaData();
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

        if (!this.currentContext && this.experimentInfo) {
          this.currentContext = this.experimentInfo.context[0];
        }

        this.isContextChanged = this.currentContext ? (this.currentContext !== this.newExperimentData.context[0]) : false;

        this.currentContext  = this.newExperimentData.context[0];

        this.stepper.next();
        console.log(' ----- the experiment data received is ---------', this.newExperimentData);
        if (path === NewExperimentPaths.POST_EXPERIMENT_RULE) {
          this.newExperimentData.queries = [];
          this.experimentService.createNewExperiment(this.newExperimentData);
          this.onNoClick();
        }
        break;
      case NewExperimentDialogEvents.UPDATE_EXPERIMENT:
        this.onNoClick();
      case NewExperimentDialogEvents.SAVE_DATA:
        this.newExperimentData = {
          ...this.experimentInfo,
          ...this.newExperimentData,
          ...formData
        };
        this.openSnackBar();
        this.experimentService.updateExperiment(this.newExperimentData);
        break;
    }
  }

  openSnackBar() {
    this._snackBar.open(this.translate.instant('global.save-confirmation.message.text') , null, { duration: 2000 });
  }
  stepChanged(event) {
    this.selectedStepperIndex = event.selectedIndex;
  }

  animationDone() {
    this.animationCompletedIndex = this.selectedStepperIndex;
  }
}
