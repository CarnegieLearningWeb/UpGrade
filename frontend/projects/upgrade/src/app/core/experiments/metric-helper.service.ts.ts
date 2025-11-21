import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ExperimentService } from './experiments.service';
import { Experiment, ExperimentQueryDTO, UpdateExperimentMetricsRequest } from './store/experiments.model';

@Injectable({
  providedIn: 'root',
})
export class MetricHelperService {
  constructor(private experimentService: ExperimentService) {}

  /**
   * Add a new metric to an experiment
   */
  addMetric(experiment: Experiment, metricData: ExperimentQueryDTO): void {
    const currentMetrics = [...(experiment.queries || [])];
    const newMetric = {
      ...metricData,
      id: uuidv4(),
    };

    const updatedMetrics = [...currentMetrics, newMetric] as ExperimentQueryDTO[];

    this.updateExperimentMetrics(experiment, updatedMetrics);
  }

  /**
   * Update an existing metric in an experiment
   */
  updateMetric(experiment: Experiment, sourceMetric: ExperimentQueryDTO, metricData: ExperimentQueryDTO): void {
    const currentMetrics = [...(experiment.queries || [])];
    const updatedMetrics = currentMetrics.map((metric) =>
      metric.id === sourceMetric.id
        ? {
            ...metric,
            ...metricData,
          }
        : metric
    );

    this.updateExperimentMetrics(experiment, updatedMetrics);
  }

  /**
   * Delete a metric from an experiment
   */
  deleteMetric(experiment: Experiment, metricToDelete: ExperimentQueryDTO): void {
    const currentMetrics = [...(experiment.queries || [])];
    const updatedMetrics = currentMetrics.filter((metric) => metric.id !== metricToDelete.id);

    this.updateExperimentMetrics(experiment, updatedMetrics);
  }

  /**
   * Common method to update experiment metrics
   */
  private updateExperimentMetrics(experiment: Experiment, updatedMetrics: ExperimentQueryDTO[]): void {
    const updateRequest: UpdateExperimentMetricsRequest = {
      experiment,
      metrics: updatedMetrics,
    };

    this.experimentService.updateExperimentMetrics(updateRequest);
  }
}