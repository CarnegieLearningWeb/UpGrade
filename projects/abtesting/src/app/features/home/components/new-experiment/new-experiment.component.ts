import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { NewExperimentDialogEvents, NewExperimentDialogData } from '../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewExperimentComponent {

  overviewForm: FormGroup;
  experimentDesignForm: FormGroup;
  newExperimentData: any = {};
  constructor(
    public dialogRef: MatDialogRef<NewExperimentComponent>,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  getExperimentData(event: NewExperimentDialogData) {
    const { type, formData } = event;
    switch (type) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.onNoClick();
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        this.newExperimentData = {
          ...this.newExperimentData,
          ...formData
        };
        break;
    }
    console.log('Form data ', this.newExperimentData);
  }
}
