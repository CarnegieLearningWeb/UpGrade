import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ExperimentVM, NewExperimentDialogData, NewExperimentDialogEvents, NewExperimentPaths, MetricUnit } from '../../../../../core/experiments/store/experiments.model';

@Component({
  selector: 'home-experiment-metric',
  templateUrl: './experiment-metric.component.html',
  styleUrls: ['./experiment-metric.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentMetricComponent {

  metrics: MetricUnit[] = [];
  @Input() experimentInfo: ExperimentVM;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  metricUpdationEvent(event) {
    this.metrics = event;
  }
  emitEvent(eventType: NewExperimentDialogEvents) {
    if (eventType === NewExperimentDialogEvents.CLOSE_DIALOG) {
      this.emitExperimentDialogEvent.emit({ type: eventType });
    } else {
      this.emitExperimentDialogEvent.emit({
        type: this.experimentInfo ? NewExperimentDialogEvents.UPDATE_EXPERIMENT : eventType,
        formData: {
          metrics: this.metrics
        },
        path: NewExperimentPaths.METRIC
      });
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
