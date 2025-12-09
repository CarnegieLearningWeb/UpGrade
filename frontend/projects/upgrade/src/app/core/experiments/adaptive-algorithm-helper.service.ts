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

  /**
   * Extract mooclet policy parameters from JSON editor value.
   * Adds the assignmentAlgorithm property for backend validation.
   * Returns undefined if the editor value is invalid or algorithm is not TS_CONFIGURABLE.
   */
  extractMoocletParametersFromEditor(editorValue: any, algorithmType: ASSIGNMENT_ALGORITHM): any | undefined {
    if (algorithmType !== ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE) {
      return undefined;
    }

    try {
      // Add assignmentAlgorithm property for backend validation
      return {
        ...editorValue,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
      };
    } catch {
      // If extraction fails, return undefined (validation will catch it)
      return undefined;
    }
  }

  /**
   * Create default TS Configurable policy parameters with the given outcome variable name.
   * Used when creating a new experiment or resetting parameters.
   */
  createDefaultTSConfigurableParameters(outcomeVariableName: string): MoocletTSConfigurablePolicyParametersDTO {
    const defaultParams = new MOOCLET_POLICY_SCHEMA_MAP[ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE]();
    defaultParams.outcome_variable_name = outcomeVariableName;
    return defaultParams;
  }
}
