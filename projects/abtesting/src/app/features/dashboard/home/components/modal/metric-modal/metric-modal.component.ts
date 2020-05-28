import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { ExperimentVM, MetricUnit } from '../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-metric-modal',
  templateUrl: './metric-modal.component.html',
  styleUrls: ['./metric-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricModalComponent {

  experimentInfo: ExperimentVM;
  metrics: MetricUnit[];
  constructor(
    private experimentService: ExperimentService,
    private dialogRef: MatDialogRef<MetricModalComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
  }

  metricUpdationEvent(metric) {
    this.metrics = metric;
  }

  updateMetric() {
    this.experimentService.updateExperiment({ ...this.experimentInfo, metrics: this.metrics });
    this.onCancelClick();
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
