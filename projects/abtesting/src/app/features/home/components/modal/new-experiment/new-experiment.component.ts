import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, POST_EXPERIMENT_RULE, EXPERIMENT_STATE } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewExperimentComponent {

  newExperimentData: any = {};
  selectedStepperIndex = 0 ;
  constructor(
    public dialogRef: MatDialogRef<NewExperimentComponent>,
    private experimentService: ExperimentService
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
        };
        if (path === NewExperimentPaths.EXPERIMENT_SCHEDULE) {
          this.newExperimentData.state = EXPERIMENT_STATE.INACTIVE,
          this.newExperimentData.postExperimentRule = POST_EXPERIMENT_RULE.CONTINUE,
          this.experimentService.createNewExperiment(this.newExperimentData);
          this.onNoClick();
        }
        break;
    }
  }

  stepChanged(event) {
    this.selectedStepperIndex = event.selectedIndex;
  }
}
