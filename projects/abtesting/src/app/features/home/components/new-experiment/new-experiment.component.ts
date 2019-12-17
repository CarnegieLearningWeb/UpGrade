import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-experiment',
  templateUrl: './new-experiment.component.html',
  styleUrls: ['./new-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewExperimentComponent implements OnInit {

  overviewForm: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<NewExperimentComponent>,
    private _formBuilder: FormBuilder,
  ) {
  }

  ngOnInit() {
    this.overviewForm = this._formBuilder.group({
      experimentName: [null, Validators.required],
      description: [null, Validators.required],
      unitOfAssignment: [null, Validators.required],
      groupType: [null, Validators.required],
      consistencyRule: [null, Validators.required],
    });
  }

  onNoClick(event?: any): void {
    this.dialogRef.close();
  }
}
