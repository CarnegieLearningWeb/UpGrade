import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidatorFn, Validators } from '@angular/forms';
import {
  ASSIGNMENT_ALGORITHM,
  MOOCLET_POLICY_SCHEMA_MAP,
  MoocletTSConfigurablePolicyParametersDTO,
  SUPPORTED_MOOCLET_ALGORITHMS,
} from 'upgrade_types';
import { ExperimentVM, TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS } from './store/experiments.model';
import { environment } from '../../../environments/environment';
import { BullettedListKeyValueFormat } from '@shared-component-lib/common-section-card-overview-details/common-section-card-overview-details.component';
import { CommonFormHelpersService } from '../../shared/services/common-form-helpers.service';

// ============================================================================
// Pure Functions (exported for use in selectors and other pure contexts)
// ============================================================================

const DEFAULT_MAX_NUMBER_INPUT = 1000000;

/**
 * Format TS Configurable policy parameters for display in the overview section.
 * Returns an array of objects with translation keys and values for proper i18n support.
 */
export function formatTSConfigurablePolicyParamDetails(
  experiment: ExperimentVM
): BullettedListKeyValueFormat[] | undefined {
  if (
    !isMoocletEnabled() ||
    !isMoocletExperiment(experiment) ||
    experiment?.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE
  ) {
    console.warn('mooclet is disabled or experiment is not using TS Configurable algorithm');
    return undefined;
  }

  const params = experiment.moocletPolicyParameters;
  const formattedParams: BullettedListKeyValueFormat[] = [];

  if (params.prior) {
    formattedParams.push({
      labelKey: TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.PRIOR_SUCCESS,
      value: params.prior.success,
    });
    formattedParams.push({
      labelKey: TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.PRIOR_FAILURE,
      value: params.prior.failure,
    });
  }

  formattedParams.push({
    labelKey: TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.BATCH_SIZE,
    value: params.batch_size,
  });
  formattedParams.push({
    labelKey: TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.UNIFORM_THRESHOLD,
    value: params.uniform_threshold,
  });
  formattedParams.push({
    labelKey: TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.TSPOSTDIFF_THRESH,
    value: params.tspostdiff_thresh,
  });
  return formattedParams;
}

export function isMoocletEnabled(): boolean {
  return environment.moocletToggle;
}

export function isMoocletAlgorithm(algorithm: ASSIGNMENT_ALGORITHM): boolean {
  return !!MOOCLET_POLICY_SCHEMA_MAP[algorithm];
}

export function isMoocletExperiment(experiment: ExperimentVM): boolean {
  return isMoocletAlgorithm(experiment.assignmentAlgorithm) && !!experiment.moocletPolicyParameters;
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface EditableTSConfigurablePolicyParameters {
  batch_size: number;
  uniform_threshold: number;
  tspostdiff_thresh: number;
  prior_success: number;
  prior_failure: number;
}

/**
 * Service providing helper methods for mooclet adaptive algorithms
 */
@Injectable({
  providedIn: 'root',
})
export class MoocletExperimentHelperService {
  // ============================================================================
  // General Mooclet Algorithm Helpers
  // ============================================================================

  isMoocletEnabled(): boolean {
    return isMoocletEnabled();
  }

  isMoocletAlgorithm(algorithm: ASSIGNMENT_ALGORITHM): boolean {
    return isMoocletAlgorithm(algorithm);
  }

  /**
   * Get supported mooclet algorithm options for UI display.
   * Returns algorithm options with descriptions, or empty array if mooclet is disabled.
   */
  getSupportedMoocletAlgorithmOptions(): Array<{
    value: ASSIGNMENT_ALGORITHM;
    description: string;
  }> {
    if (!this.isMoocletEnabled()) {
      console.warn('Mooclet API is disabled in the environment configuration.');
      return [];
    }

    const supportedMoocletAlgorithms = SUPPORTED_MOOCLET_ALGORITHMS as ASSIGNMENT_ALGORITHM[];
    return supportedMoocletAlgorithms.map((algorithmName) => ({
      value: algorithmName,
      description: `Adaptive Experiment Algorithm: ${algorithmName}`,
    }));
  }

  // ============================================================================
  // ts_configurable Policy Parameters Helpers
  // ============================================================================

  isTSConfigurable(algorithm: ASSIGNMENT_ALGORITHM): boolean {
    return algorithm === ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE;
  }

  /**
   * Get default TS Configurable parameters instance.
   * Provides a single source of truth for default parameter values.
   */
  getTSConfigurableDefaults(): MoocletTSConfigurablePolicyParametersDTO {
    return new MoocletTSConfigurablePolicyParametersDTO();
  }

  /**
   * Validate mooclet policy parameters against the TS Configurable schema.
   * Returns an Observable of validation errors (empty array if valid).
   */
  validateTSConfigurablePolicyParameters(jsonValue: any): Observable<ValidationError[]> {
    const ValidatorClass = MOOCLET_POLICY_SCHEMA_MAP[ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE];

    const plainDTO = {
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      ...jsonValue,
    };
    const DTOInstance = plainToInstance(ValidatorClass, plainDTO);
    // allowing unknown values until we can use nested validation properly
    return from(validate(DTOInstance, { forbidUnknownValues: false }));
  }

  /**
   * Derive editable form values from existing or default parameters.
   * Extracts only the user-configurable fields for form initialization.
   */
  deriveEditableParametersForTSConfigurable(
    existingParams?: MoocletTSConfigurablePolicyParametersDTO
  ): EditableTSConfigurablePolicyParameters {
    const defaults = this.getTSConfigurableDefaults();
    const source = existingParams || defaults;

    return {
      batch_size: source.batch_size,
      uniform_threshold: source.uniform_threshold,
      tspostdiff_thresh: source.tspostdiff_thresh,
      prior_success: source.prior?.success,
      prior_failure: source.prior?.failure,
    };
  }

  /**
   * Build complete DTO from editable parameters.
   * Combines user-provided values with system-generated and default values.
   * Note: outcome_variable_name is now generated server-side during experiment creation.
   */
  buildTSConfigurablePolicyParametersDTO(
    editableParams: EditableTSConfigurablePolicyParameters
  ): MoocletTSConfigurablePolicyParametersDTO {
    const defaults = this.getTSConfigurableDefaults();
    return {
      // User-configurable fields
      batch_size: editableParams.batch_size,
      uniform_threshold: editableParams.uniform_threshold,
      tspostdiff_thresh: editableParams.tspostdiff_thresh,
      prior: {
        success: editableParams.prior_success,
        failure: editableParams.prior_failure,
      },
      // System-managed fields
      assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      max_rating: defaults.max_rating,
      min_rating: defaults.min_rating,
    } as MoocletTSConfigurablePolicyParametersDTO;
  }

  /**
   * Get field validators configuration for TS Configurable parameters.
   * Provides validation rules based on default minimum values.
   */
  getTSConfigurableFieldValidators(): Record<string, ValidatorFn[]> {
    const defaults = this.getTSConfigurableDefaults();

    return {
      batch_size: [
        Validators.required,
        Validators.min(defaults.batch_size),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      uniform_threshold: [
        Validators.required,
        Validators.min(defaults.uniform_threshold),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      tspostdiff_thresh: [Validators.required, Validators.min(defaults.tspostdiff_thresh), Validators.max(1.0)],
      prior_success: [
        Validators.required,
        Validators.min(defaults.prior.success),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
      prior_failure: [
        Validators.required,
        Validators.min(defaults.prior.failure),
        Validators.max(DEFAULT_MAX_NUMBER_INPUT),
        CommonFormHelpersService.integerValidator(),
      ],
    };
  }
}
