import { Component, OnInit, ViewChild } from '@angular/core';
import { JsonEditorOptions, JsonEditorComponent } from 'ang-jsoneditor';
import { MatDialogRef } from '@angular/material';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';

@Component({
  selector: 'app-add-metrics',
  templateUrl: './add-metrics.component.html',
  styleUrls: ['./add-metrics.component.scss']
})
export class AddMetricsComponent implements OnInit {
  options = new JsonEditorOptions();
  metricsEditorError = false;
  @ViewChild('metricsEditor', { static: false }) metricsEditor: JsonEditorComponent;
  constructor(
    private dialogRef: MatDialogRef<AddMetricsComponent>,
    private analysisService: AnalysisService
  ) {
  }

  ngOnInit() {
    this.options.mode = 'code';
    this.options.statusBar = false;

    this.options.onChange = () => {
      try {
        this.metricsEditor.get();
        this.metricsEditorError = false;
      } catch (e) {
        this.metricsEditorError = true;
      }
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  addMetrics() {
    const json = this.metricsEditor.get();
    let data: any = {};
    if (Array.isArray(json)) {
      data = {
        metricUnit: json
      }
    } else {
      data = {
        metricUnit: [json]
      }
    }
    this.analysisService.upsertMetrics(data);
    this.onCancelClick();
  }
}
