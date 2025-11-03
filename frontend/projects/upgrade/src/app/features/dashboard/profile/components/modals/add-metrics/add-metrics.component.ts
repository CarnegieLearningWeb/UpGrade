import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { JsonEditorOptions, JsonEditorComponent } from 'ang-jsoneditor';
import { MatDialogRef } from '@angular/material/dialog';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { Subscription } from 'rxjs';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { IContextMetaData } from '../../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'app-add-metrics',
  templateUrl: './add-metrics.component.html',
  styleUrls: ['./add-metrics.component.scss'],
  standalone: false,
})
export class AddMetricsComponent implements OnInit, AfterViewInit, OnDestroy {
  options = new JsonEditorOptions();
  metricsEditorError = false;

  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;
  allContexts: string[];
  selectedContextOption: string;
  isContextSelected = false;
  exampleMetricPlaceholderValue: any = [
    { metric: 'exampleContinuousMetricKey', datatype: 'continuous' },
    { metric: 'exampleCategoricalMetricKey', datatype: 'categorical', allowedValues: ['value1', 'value2'] },
    {
      groupClass: 'exampleGroup',
      allowedKeys: ['key1', 'key2'],
      attributes: [
        { metric: 'exampleNestedContinousMetricKey', datatype: 'continuous' },
        { metric: 'exampleNestedCategoricalMetricKey', datatype: 'categorical', allowedValues: ['option1', 'option2'] },
      ],
    },
  ];

  @ViewChild('metricsEditor', { static: false }) metricsEditor: JsonEditorComponent;
  constructor(
    private dialogRef: MatDialogRef<AddMetricsComponent>,
    private analysisService: AnalysisService,
    private experimentService: ExperimentService
  ) {}

  ngOnInit() {
    this.experimentService.fetchContextMetaData();
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;

      if (this.contextMetaData && this.contextMetaData.contextMetadata) {
        this.allContexts = Object.keys(this.contextMetaData.contextMetadata);
      }
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

  ngAfterViewInit() {
    // Set the placeholder value after the view is initialized
    if (this.metricsEditor) {
      try {
        this.metricsEditor.set(this.exampleMetricPlaceholderValue);
      } catch (e) {
        console.warn('Failed to set placeholder value in metrics editor:', e);
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
        metricUnit: json,
        context: [this.selectedContextOption],
      };
    } else {
      data = {
        metricUnit: [json],
        context: [this.selectedContextOption],
      };
    }
    this.analysisService.upsertMetrics(data);
    this.onCancelClick();
  }

  contextIsSelected() {
    this.isContextSelected = true;
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
  }
}
