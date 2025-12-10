import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ASSIGNMENT_ALGORITHM,
  MOOCLET_POLICY_SCHEMA_MAP,
  MoocletTSConfigurablePolicyParametersDTO,
} from 'upgrade_types';
import { ExperimentVM, TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS } from './store/experiments.model';
import { environment } from '../../../environments/environment';

// ============================================================================
// Pure Functions (exported for use in selectors and other pure contexts)
// ============================================================================

/**
 * Format TS Configurable policy parameters for display in the overview section.
 * Returns an array of formatted strings showing parameter labels and values.
 * This is mainly for us in selectors
 */
export function formatTSConfigurablePolicyParamDetails(experiment: ExperimentVM): string[] | undefined {
  if (
    !environment.moocletToggle ||
    experiment?.assignmentAlgorithm !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE ||
    !experiment?.moocletPolicyParameters
  ) {
    return undefined;
  }

  const params = experiment.moocletPolicyParameters;
  const formattedParams: string[] = [];

  if (params.prior) {
    formattedParams.push(`${TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.PRIOR_SUCCESS}: ${params.prior.success}`);
    formattedParams.push(`${TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.PRIOR_FAILURE}: ${params.prior.failure}`);
  }

  formattedParams.push(`${TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.BATCH_SIZE}: ${params.batch_size}`);
  formattedParams.push(`${TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.UNIFORM_THRESHOLD}: ${params.uniform_threshold}`);
  formattedParams.push(`${TS_CONFIGURABLE_OVERVIEW_PARAM_LABELS.TSPOSTDIFF_THRESH}: ${params.tspostdiff_thresh}`);
  return formattedParams;
}

// ============================================================================
// Service Class (for stateful operations that need dependency injection)
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class AdaptiveAlgorithmHelperService {
  /**
   * Check if mooclet/adaptive experiments are enabled in the environment.
   */
  isMoocletEnabled(): boolean {
    return environment.moocletToggle;
  }

  isMoocletAlgorithm(algorithm: ASSIGNMENT_ALGORITHM): boolean {
    return !!MOOCLET_POLICY_SCHEMA_MAP[algorithm];
  }

  generateUniqueOutcomeVariableName(experimentName: string): string {
    // first 10 chars of experiment name, sanitized
    const baseName = experimentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 10);

    // append ISO date timestamp suffix to ensure uniqueness
    const timestamp = new Date().toISOString();
    return `${baseName}_${timestamp}_REWARD_VARIABLE`;
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
    return from(validate(DTOInstance));
  }
}
