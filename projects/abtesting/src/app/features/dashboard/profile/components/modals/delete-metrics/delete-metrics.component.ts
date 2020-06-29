import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { METRICS_JOIN_TEXT } from '../../../../../../core/analysis/store/analysis.models';

@Component({
  selector: 'app-delete-metrics',
  templateUrl: './delete-metrics.component.html',
  styleUrls: ['./delete-metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteMetricsComponent {

  constructor(
    private analysisService: AnalysisService,
    public dialogRef: MatDialogRef<DeleteMetricsComponent>,
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
