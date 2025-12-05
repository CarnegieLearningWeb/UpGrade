import { Injectable } from '@angular/core';

import {
  MetricFormData,
  UPSERT_EXPERIMENT_ACTION,
  MetricOption,
  MetricObjectResult,
  TypedMetricFormValue,
  isGlobalMetricFormValue,
  isRepeatableMetricFormValue,
  ExperimentQueryDTO,
  MetricFormControlValue,
  isMetricOption,
} from '../../../../../../core/experiments/store/experiments.model';
import { METRICS_JOIN_TEXT } from '../../../../../../core/analysis/store/analysis.models';
import { METRIC_TYPE, REPEATED_MEASURE, IMetricMetaData } from 'upgrade_types';

/**
 * Service to handle form data parsing, transformation, and initialization
 * for the metric modal. Separates data transformation logic from component.
 */
@Injectable({
  providedIn: 'root',
})
export class MetricFormDataService {
  /**
   * Parse source query to derive initial form values
   */
  parseSourceQuery(sourceQuery: any, action: UPSERT_EXPERIMENT_ACTION): MetricFormData {
    if (action === UPSERT_EXPERIMENT_ACTION.EDIT && sourceQuery) {
      const metricKey = sourceQuery.metric?.key || '';

      // Determine if it's repeatable by checking if the metric key contains METRICS_JOIN_TEXT
      const isRepeatable = metricKey.includes(METRICS_JOIN_TEXT);

      let metricClass = '';
      let metricKeyValue = '';
      let metricId = '';

      if (isRepeatable) {
        // Parse combined key for repeatable metrics: "class@__@key@__@id"
        const keyParts = metricKey.split(METRICS_JOIN_TEXT);
        if (keyParts.length === 3) {
          metricClass = keyParts[0];
          metricKeyValue = keyParts[1];
          metricId = keyParts[2];
        } else {
          // Fallback if format is unexpected
          metricId = metricKey;
        }
      } else {
        // Global metric: use the key as-is for metricId
        metricId = metricKey;
      }

      return {
        metricType: isRepeatable ? METRIC_TYPE.REPEATABLE : METRIC_TYPE.GLOBAL,
        metricId,
        displayName: sourceQuery.name || '',
        metricClass,
        metricKey: metricKeyValue,
        aggregateStatistic: sourceQuery.query?.operationType || '',
        individualStatistic: sourceQuery.repeatedMeasure || '',
        comparison: sourceQuery.query?.compareFn || '=',
        compareValue: sourceQuery.query?.compareValue || '',
        allowableDataKeys: [],
      };
    }

    // Default values for add mode
    return this.getDefaultFormValues();
  }

  /**
   * Get default form values for a new metric
   */
  getDefaultFormValues(): MetricFormData {
    return {
      metricType: METRIC_TYPE.GLOBAL,
      metricId: '',
      displayName: '',
      metricClass: '',
      metricKey: '',
      aggregateStatistic: '',
      individualStatistic: '',
      comparison: '=',
      compareValue: '',
      allowableDataKeys: [],
    };
  }

  /**
   * Find metric objects in the hierarchy based on initial form values
   */
  findMetricObjects(metrics: MetricOption[], initialValues: MetricFormData): MetricObjectResult {
    const { metricType, metricClass, metricKey, metricId } = initialValues;

    if (metricType === METRIC_TYPE.REPEATABLE) {
      return this.findRepeatableMetricObjects(metrics, metricClass, metricKey, metricId);
    }

    // Global metric: find the metric directly
    return {
      classObject: null,
      keyObject: null,
      idObject: metrics.find((m) => m.key === metricId) ?? null,
    };
  }

  /**
   * Find repeatable metric objects (class, key, id) in the hierarchy
   */
  findRepeatableMetricObjects(
    metrics: MetricOption[],
    metricClass: string,
    metricKey: string,
    metricId: string
  ): MetricObjectResult {
    const classObject = metrics.find((m) => m.key === metricClass) ?? null;

    if (!classObject?.children) {
      return { classObject, keyObject: null, idObject: null };
    }

    const keyObject = classObject.children.find((k) => k.key === metricKey) ?? null;

    if (!keyObject) {
      return { classObject, keyObject: null, idObject: null };
    }

    // Find ID object in key's children, or use key itself if no children
    const idObject = keyObject.children?.length
      ? keyObject.children.find((id) => id.key === metricId) ?? null
      : keyObject;

    return { classObject, keyObject, idObject };
  }

  /**
   * Prepare form data for backend submission
   */
  prepareForBackend(formValue: TypedMetricFormValue, metricDataType: IMetricMetaData | null): ExperimentQueryDTO {
    const { metricId, displayName, aggregateStatistic, comparison, compareValue } = formValue;

    // Prepare metric key based on type using type guards
    const metricKey = isGlobalMetricFormValue(formValue)
      ? this.extractKey(metricId)
      : `${this.extractKey(formValue.metricClass)}${METRICS_JOIN_TEXT}${this.extractKey(
          formValue.metricKey
        )}${METRICS_JOIN_TEXT}${this.extractKey(metricId)}`;

    // Prepare query object
    const queryObj: ExperimentQueryDTO = {
      name: displayName,
      query: {
        operationType: aggregateStatistic,
        // Add comparison for categorical metrics
        ...(metricDataType === IMetricMetaData.CATEGORICAL &&
          comparison &&
          compareValue && {
            compareFn: comparison,
            compareValue: compareValue,
          }),
      },
      metric: {
        key: metricKey,
      },
      repeatedMeasure: isRepeatableMetricFormValue(formValue)
        ? (formValue.individualStatistic as REPEATED_MEASURE)
        : REPEATED_MEASURE.mostRecent,
    };

    return queryObj;
  }

  /**
   * Extract the key string from a MetricFormControlValue
   */
  private extractKey(value: MetricFormControlValue): string {
    return isMetricOption(value) ? value.key : value || '';
  }

  /**
   * Parse a metric key to determine type and component parts
   */
  parseMetricKey(metricKey: string): {
    isRepeatable: boolean;
    metricClass?: string;
    metricKey?: string;
    metricId: string;
  } {
    const isRepeatable = metricKey.includes(METRICS_JOIN_TEXT);

    if (isRepeatable) {
      const keyParts = metricKey.split(METRICS_JOIN_TEXT);
      if (keyParts.length === 3) {
        return {
          isRepeatable: true,
          metricClass: keyParts[0],
          metricKey: keyParts[1],
          metricId: keyParts[2],
        };
      }
    }

    return {
      isRepeatable: false,
      metricId: metricKey,
    };
  }
}
