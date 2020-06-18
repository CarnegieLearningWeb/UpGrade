import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-delete-experiment',
  templateUrl: './delete-experiment.component.html',
  styleUrls: ['./delete-experiment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteExperimentComponent {

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<DeleteExperimentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteExperiment() {
    this.experimentService.deleteExperiment(this.data.experimentId);
    this.onCancelClick();
  }
}
