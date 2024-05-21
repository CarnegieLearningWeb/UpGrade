import { Component, OnInit, ViewChild } from '@angular/core';
import { JsonEditorOptions, JsonEditorComponent } from 'ang-jsoneditor';
import { MatDialogRef } from '@angular/material/dialog';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-add-metrics',
  templateUrl: './add-metrics.component.html',
  styleUrls: ['./add-metrics.component.scss'],
})
export class AddMetricsComponent implements OnInit {
  options = new JsonEditorOptions();
  metricsEditorError = false;
  allMetrics: any;
  allMetricsSub: Subscription;
  contextOptions: string[] = [];
  @ViewChild('metricsEditor', { static: false }) metricsEditor: JsonEditorComponent;
  constructor(private dialogRef: MatDialogRef<AddMetricsComponent>, private analysisService: AnalysisService) {}

  ngOnInit() {
    this.allMetricsSub = this.analysisService.allMetrics$.subscribe((metrics) => {
      this.allMetrics = new MatTableDataSource();
      this.allMetrics.data = metrics;
      this.extractContext(this.allMetrics.data);
    });
    this.options = new JsonEditorOptions();
    this.options.mode = 'code';
    this.options.statusBar = false;

    this.options.onChange = () => {
      try {
        this.metricsEditor.get();
        this.metricsEditorError = false;
      } catch (e) {
        this.metricsEditorError = true;
      }
    };
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  addMetrics() {
    const json = this.metricsEditor.get();
    let data: any = {};
    if (Array.isArray(json)) {
      data = {
        metricUnit: json,
      };
    } else {
      data = {
        metricUnit: [json],
      };
    }
    this.analysisService.upsertMetrics(data);
    this.onCancelClick();
  }
  extractContext(data: any[]): void {
    const contextValuesSet = new Set<string>(); // Using Set to automatically remove duplicates

    function extractContextRecursively(obj: any) {
      if (obj.context && Array.isArray(obj.context)) {
        obj.context.forEach((value: string) => contextValuesSet.add(value));
      }
      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach((child: any) => extractContextRecursively(child));
      }
    }

    data.forEach((item) => extractContextRecursively(item));

    this.contextOptions = Array.from(contextValuesSet); // Convert Set back to array
  }
}
