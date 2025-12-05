import { Injectable } from '@angular/core';
import { FormGroup, Validators, ValidatorFn } from '@angular/forms';

import { METRIC_TYPE, IMetricMetaData } from 'upgrade_types';
import { StatisticOptions } from '../../../../../../core/experiments/services/metric-type-detection.service';
import { CommonFormHelpersService } from '../../../../../../shared/services/common-form-helpers.service';

/**
 * Service to manage form state, visibility, and validators for the metric modal.
 * Consolidates logic for showing/hiding fields and updating validators dynamically.
 */
@Injectable({
  providedIn: 'root',
})
export class MetricFormStateManager {
  /**
   * Determine which fields should be visible based on form state
   */
  calculateVisibility(
    metricType: METRIC_TYPE,
    hasValidMetricIdSelection: boolean,
    metricDataType: IMetricMetaData | null
  ): {
    showMetricClass: boolean;
    showMetricKey: boolean;
    showAggregateStatistic: boolean;
    showIndividualStatistic: boolean;
    showComparison: boolean;
  } {
    const showMetricClass = metricType === METRIC_TYPE.REPEATABLE;
    const showMetricKey = metricType === METRIC_TYPE.REPEATABLE;

    // Statistics only show when a valid metric ID option has been selected
    const showAggregateStatistic = hasValidMetricIdSelection && metricDataType !== null;
    const showIndividualStatistic = showAggregateStatistic && metricType === METRIC_TYPE.REPEATABLE;
    const showComparison = showAggregateStatistic && metricDataType === IMetricMetaData.CATEGORICAL;

    return {
      showMetricClass,
      showMetricKey,
      showAggregateStatistic,
      showIndividualStatistic,
      showComparison,
    };
  }

  /**
   * Update form validators based on current state
   */
  updateValidators(
    form: FormGroup,
    metricType: METRIC_TYPE,
    showAggregateStatistic: boolean,
    showComparison: boolean,
    autocompleteValidator: ValidatorFn
  ): void {
    // Build validator configuration
    const validatorConfig: { [key: string]: ValidatorFn[] | null } = {};

    // Repeatable metric validators
    if (metricType === METRIC_TYPE.REPEATABLE) {
      validatorConfig['metricClass'] = [Validators.required, autocompleteValidator];
      validatorConfig['metricKey'] = [Validators.required, autocompleteValidator];
      validatorConfig['individualStatistic'] = [Validators.required];
    } else {
      validatorConfig['metricClass'] = null;
      validatorConfig['metricKey'] = null;
      validatorConfig['individualStatistic'] = null;
    }

    // Aggregate statistic validator
    if (showAggregateStatistic) {
      validatorConfig['aggregateStatistic'] = [Validators.required];
    } else {
      validatorConfig['aggregateStatistic'] = null;
    }

    // Comparison validators for categorical metrics
    if (showComparison) {
      validatorConfig['comparison'] = [Validators.required];
      validatorConfig['compareValue'] = [Validators.required];
    } else {
      validatorConfig['comparison'] = null;
      validatorConfig['compareValue'] = null;
    }

    // Apply validators using helper service
    CommonFormHelpersService.updateValidatorsFromConfig(form, validatorConfig, false);

    // Update the form's overall validity status WITH event emission
    form.updateValueAndValidity({ emitEvent: true });
  }

  /**
   * Clear statistic selections that are no longer valid for the current metric type
   */
  clearInvalidStatisticSelections(
    form: FormGroup,
    hasValidMetricIdSelection: boolean,
    options: StatisticOptions
  ): void {
    if (!form || !hasValidMetricIdSelection) {
      return;
    }

    const aggregateControl = form.get('aggregateStatistic');
    const individualControl = form.get('individualStatistic');

    const validAggregateValues = options.aggregate.map((option) => option.value);
    const currentAggregateValue = aggregateControl?.value;

    if (currentAggregateValue && !validAggregateValues.includes(currentAggregateValue)) {
      aggregateControl?.setValue('', { emitEvent: false });
    }

    const validIndividualValues = options.individual.map((option) => option.value);
    const currentIndividualValue = individualControl?.value;

    if (currentIndividualValue && !validIndividualValues.includes(currentIndividualValue)) {
      individualControl?.setValue('', { emitEvent: false });
    }
  }

  /**
   * Reset all statistic fields to their default values
   */
  resetStatisticFields(form: FormGroup): void {
    form.patchValue({
      aggregateStatistic: '',
      individualStatistic: '',
      comparison: '=',
      compareValue: '',
    });
  }
}
