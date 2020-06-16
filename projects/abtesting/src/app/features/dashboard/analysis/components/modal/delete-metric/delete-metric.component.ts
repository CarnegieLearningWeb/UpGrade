import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { METRICS_JOIN_TEXT } from '../../../../../../core/analysis/store/analysis.models';

@Component({
  selector: 'app-delete-metric',
  templateUrl: './delete-metric.component.html',
  styleUrls: ['./delete-metric.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteMetricComponent {

  constructor(
    private analysisService: AnalysisService,
    public dialogRef: MatDialogRef<DeleteMetricComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteMetric() {
    this.analysisService.deleteMetric(this.data.key.join(METRICS_JOIN_TEXT));
    this.onCancelClick();
  }

}
