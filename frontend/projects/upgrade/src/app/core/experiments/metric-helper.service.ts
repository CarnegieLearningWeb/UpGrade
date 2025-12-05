import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ExperimentService } from './experiments.service';
import {
  Experiment,
  ExperimentQueryDTO,
  UpdateExperimentMetricsRequest,
  MetricOption,
  MetricFormControlValue,
  isMetricOption,
} from './store/experiments.model';
import { ASSIGNMENT_UNIT } from 'upgrade_types';

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

  /**
   * Filter metrics based on assignment unit and context
   */
  filterMetricsByAssignmentContext(
    metrics: MetricOption[],
    assignmentUnit: ASSIGNMENT_UNIT | null,
    context: string[] | null
  ): MetricOption[] {
    if (!metrics?.length) {
      return [];
    }

    // For within-subjects experiments, return only metrics with children (repeatable)
    if (assignmentUnit === ASSIGNMENT_UNIT.WITHIN_SUBJECTS) {
      const withinSubjectsMetrics = metrics.filter((metric) => metric.children && metric.children.length > 0);
      return withinSubjectsMetrics.length > 0 ? withinSubjectsMetrics : metrics;
    }

    // Filter by context if available
    if (assignmentUnit && context?.length) {
      const contextFilteredMetrics = metrics.filter(
        (metric) => metric.context && context.some((ctx) => metric.context.includes(ctx))
      );
      if (contextFilteredMetrics.length > 0) {
        return contextFilteredMetrics;
      }
    }

    return metrics;
  }

  /**
   * Get global metric options (metrics without children)
   */
  getGlobalMetricOptions(metrics: MetricOption[]): MetricOption[] {
    return metrics.filter((metric) => !metric.children || metric.children.length === 0);
  }

  /**
   * Get repeatable metric options (metrics with children)
   */
  getRepeatableMetricOptions(metrics: MetricOption[]): MetricOption[] {
    return metrics.filter((metric) => metric.children && metric.children.length > 0);
  }

  /**
   * Resolve a form control value to a MetricOption
   */
  resolveOption(controlValue: MetricFormControlValue, options: MetricOption[] = []): MetricOption | undefined {
    if (!controlValue) {
      return undefined;
    }
    if (isMetricOption(controlValue)) {
      return controlValue;
    }
    return this.findOptionByKey(options, this.extractKey(controlValue));
  }

  /**
   * Find an option by its key
   */
  private findOptionByKey(options: MetricOption[], key: string): MetricOption | undefined {
    if (!options.length || !key) {
      return undefined;
    }
    return options.find((option) => option?.key === key);
  }

  /**
   * Extract the key string from a MetricFormControlValue
   */
  private extractKey(value: MetricFormControlValue): string {
    return isMetricOption(value) ? value.key : value || '';
  }
}
