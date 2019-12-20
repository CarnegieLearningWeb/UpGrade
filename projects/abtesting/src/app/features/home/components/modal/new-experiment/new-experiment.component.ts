import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewExperimentComponent {

  newExperimentData: any = {};
  constructor(
    public dialogRef: MatDialogRef<NewExperimentComponent>,
  ) {}

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
          state: EXPERIMENT_STATE.INACTIVE,
          postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE
        };
        if (path === NewExperimentPaths.EXPERIMENT_SCHEDULE) {
          this.newExperimentData.startOn = new Date().toISOString();
          console.log('Experiment form data', this.newExperimentData);
        }
        break;
    }
  }
}
