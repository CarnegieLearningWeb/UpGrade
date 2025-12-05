import { Injectable } from '@angular/core';

import { MetricOption, MetricFormControlValue, isMetricOption } from '../store/experiments.model';
import { IMetricMetaData, OPERATION_TYPES, REPEATED_MEASURE } from 'upgrade_types';

/**
 * Result of detecting metric type with associated data
 */
export interface MetricTypeDetectionResult {
  dataType: IMetricMetaData;
  allowableDataKeys: string[];
}

/**
 * Statistic options for a specific metric data type
 */
export interface StatisticOptions {
  aggregate: StatisticOption[];
  individual: StatisticOption[];
}

export interface StatisticOption {
  value: string;
  label: string;
}

/**
 * Service to detect metric data types (continuous vs categorical)
 * and provide appropriate statistic options
 */
@Injectable({
  providedIn: 'root',
})
export class MetricTypeDetectionService {
  // Statistic options for continuous metrics
  private readonly continuousAggregateOptions: StatisticOption[] = [
    { value: OPERATION_TYPES.SUM, label: 'Sum' },
    { value: OPERATION_TYPES.MIN, label: 'Min' },
    { value: OPERATION_TYPES.MAX, label: 'Max' },
    { value: OPERATION_TYPES.COUNT, label: 'Count' },
    { value: OPERATION_TYPES.AVERAGE, label: 'Mean' },
    { value: OPERATION_TYPES.MODE, label: 'Mode' },
    { value: OPERATION_TYPES.MEDIAN, label: 'Median' },
    { value: OPERATION_TYPES.STDEV, label: 'Standard Deviation' },
  ];

  private readonly continuousIndividualOptions: StatisticOption[] = [
    { value: REPEATED_MEASURE.mean, label: 'Mean' },
    { value: REPEATED_MEASURE.earliest, label: 'Earliest' },
    { value: REPEATED_MEASURE.mostRecent, label: 'Most Recent' },
  ];

  // Statistic options for categorical metrics
  private readonly categoricalAggregateOptions: StatisticOption[] = [
    { value: OPERATION_TYPES.COUNT, label: 'Count' },
    { value: OPERATION_TYPES.PERCENTAGE, label: 'Percentage' },
  ];

  private readonly categoricalIndividualOptions: StatisticOption[] = [
    { value: REPEATED_MEASURE.earliest, label: 'Earliest' },
    { value: REPEATED_MEASURE.mostRecent, label: 'Most Recent' },
  ];

  // Keywords for heuristic detection
  private readonly continuousKeywords = ['time', 'count', 'score', 'number', 'seconds', 'minutes', 'duration'];
  private readonly categoricalKeywords = ['status', 'type', 'category', 'level', 'completion'];

  /**
   * Detect the data type of a metric
   */
  detectMetricDataType(metricId: MetricFormControlValue, availableOptions?: MetricOption[]): MetricTypeDetectionResult {
    const selectedMetric = this.findMetricOption(metricId, availableOptions);

    // Use metadata if available
    if (selectedMetric?.metadata?.type) {
      return {
        dataType: selectedMetric.metadata.type,
        allowableDataKeys: this.extractAllowableDataKeys(selectedMetric),
      };
    }

    // Fallback to heuristic detection
    const dataType = this.detectByHeuristic(metricId);
    return {
      dataType,
      allowableDataKeys: [],
    };
  }

  /**
   * Get statistic options for a given metric data type
   */
  getStatisticOptions(dataType: IMetricMetaData): StatisticOptions {
    if (dataType === IMetricMetaData.CONTINUOUS) {
      return {
        aggregate: this.continuousAggregateOptions,
        individual: this.continuousIndividualOptions,
      };
    }

    return {
      aggregate: this.categoricalAggregateOptions,
      individual: this.categoricalIndividualOptions,
    };
  }

  /**
   * Check if a metric data type is categorical
   */
  isCategorical(dataType: IMetricMetaData | null): boolean {
    return dataType === IMetricMetaData.CATEGORICAL;
  }

  /**
   * Check if a metric data type is continuous
   */
  isContinuous(dataType: IMetricMetaData | null): boolean {
    return dataType === IMetricMetaData.CONTINUOUS;
  }

  /**
   * Find a metric option from a form control value
   */
  private findMetricOption(metricId: MetricFormControlValue, availableOptions?: MetricOption[]): MetricOption | null {
    if (isMetricOption(metricId) && metricId.metadata) {
      return metricId;
    }

    if (typeof metricId === 'string' && availableOptions) {
      return availableOptions.find((metric) => metric.key === metricId) ?? null;
    }

    return null;
  }

  /**
   * Extract allowable data keys for categorical metrics
   */
  private extractAllowableDataKeys(metric: MetricOption): string[] {
    if (metric.metadata?.type === IMetricMetaData.CATEGORICAL && metric.allowedData) {
      return [...metric.allowedData];
    }
    return [];
  }

  /**
   * Detect metric type by analyzing the metric key using keywords
   */
  private detectByHeuristic(metricId: MetricFormControlValue): IMetricMetaData {
    const metricKey = this.extractKey(metricId);
    const lowerMetricKey = metricKey.toLowerCase();

    if (this.continuousKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
      return IMetricMetaData.CONTINUOUS;
    }

    if (this.categoricalKeywords.some((keyword) => lowerMetricKey.includes(keyword))) {
      return IMetricMetaData.CATEGORICAL;
    }

    // Default to continuous for unknown types
    return IMetricMetaData.CONTINUOUS;
  }

  /**
   * Extract the key string from a MetricFormControlValue
   */
  private extractKey(value: MetricFormControlValue): string {
    return isMetricOption(value) ? value.key : value || '';
  }
}
