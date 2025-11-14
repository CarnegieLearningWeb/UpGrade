import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ExperimentService } from './experiments.service';
import {
  Experiment,
  ExperimentCondition,
  UpdateExperimentConditionsRequest,
  ConditionFormData,
  WeightingMethod,
  WEIGHTING_METHOD,
} from './store/experiments.model';
import { ConditionWeightUpdate } from '../../features/dashboard/experiments/modals/edit-condition-weights-modal/edit-condition-weights-modal.component';

export const WEIGHT_CONFIG = {
  TOTAL_WEIGHT: 100,
  DECIMAL_PLACES: 2,
  VALIDATION_TOLERANCE: 0.1, // Allow rounding errors from equal distribution (e.g., 3 × 33.33 = 99.99)
} as const;

// ============================================================================
// Pure Functions (exported for use in selectors and other pure contexts)
// ============================================================================

/**
 * Round to configured decimal places (2 decimals)
 */
function roundToDecimalPlaces(value: number): number {
  const multiplier = Math.pow(10, WEIGHT_CONFIG.DECIMAL_PLACES);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Check if two weights are equal within tolerance
 */
function isWeightEqual(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) < WEIGHT_CONFIG.VALIDATION_TOLERANCE;
}

/**
 * Determine the weighting method for a set of conditions.
 * Returns 'equal' if all weights are the same, 'custom' otherwise.
 */
export function determineWeightingMethod(conditions: ExperimentCondition[]): WeightingMethod {
  if (!conditions || conditions.length === 0) {
    return WEIGHTING_METHOD.EQUAL; // Default to equal weighting for new experiments
  }

  const expectedWeight = roundToDecimalPlaces(WEIGHT_CONFIG.TOTAL_WEIGHT / conditions.length);
  const isEqual = conditions.every((condition) => isWeightEqual(condition.assignmentWeight, expectedWeight));

  return isEqual ? WEIGHTING_METHOD.EQUAL : WEIGHTING_METHOD.CUSTOM;
}

/**
 * Distributes weights equally across all conditions.
 * All conditions get the exact same weight rounded to 2 decimals.
 * Total may be 99.99% or 100.01% due to rounding - this is acceptable.
 */
export function distributeWeightsEqually(conditions: ExperimentCondition[] | ConditionWeightUpdate[]): void {
  if (!conditions || conditions.length === 0) return;

  const equalWeight = roundToDecimalPlaces(WEIGHT_CONFIG.TOTAL_WEIGHT / conditions.length);

  conditions.forEach((condition) => {
    condition.assignmentWeight = equalWeight;
  });
}

/**
 * Check if total weights sum to 100 within tolerance.
 * Used for validation warnings.
 */
export function isWeightSumValid(conditions: ExperimentCondition[]): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  const totalWeight = conditions.reduce((sum, condition) => sum + (condition.assignmentWeight || 0), 0);

  return Math.abs(totalWeight - WEIGHT_CONFIG.TOTAL_WEIGHT) < WEIGHT_CONFIG.VALIDATION_TOLERANCE;
}

// ============================================================================
// Service Class (for stateful operations that need dependency injection)
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class ConditionHelperService {
  constructor(private experimentService: ExperimentService) {}

  /**
   * Add a new condition to an experiment
   */
  addCondition(experiment: Experiment, conditionData: ConditionFormData): void {
    const currentConditions = [...(experiment.conditions || [])];
    const newCondition = {
      id: uuidv4(),
      conditionCode: conditionData.conditionCode,
      description: conditionData.description,
      assignmentWeight: 0,
      order: currentConditions.length + 1,
    };

    const updatedConditions = [...currentConditions, newCondition] as ExperimentCondition[];

    // Check if weights should be distributed equally
    const weightingMethod = determineWeightingMethod(currentConditions);
    if (weightingMethod === WEIGHTING_METHOD.EQUAL) {
      distributeWeightsEqually(updatedConditions);
    }

    this.updateExperimentConditions(experiment, updatedConditions);
  }

  /**
   * Update an existing condition in an experiment
   */
  updateCondition(
    experiment: Experiment,
    sourceCondition: ExperimentCondition,
    conditionData: ConditionFormData
  ): void {
    const currentConditions = [...(experiment.conditions || [])];
    const updatedConditions = currentConditions.map((c) =>
      c.id === sourceCondition.id
        ? {
            ...c,
            conditionCode: conditionData.conditionCode,
            description: conditionData.description,
          }
        : c
    );

    this.updateExperimentConditions(experiment, updatedConditions);
  }

  /**
   * Delete a condition from an experiment
   */
  deleteCondition(experiment: Experiment, conditionToDelete: ExperimentCondition): void {
    const currentConditions = [...(experiment.conditions || [])];
    const updatedConditions = currentConditions.filter((c) => c.id !== conditionToDelete.id);
    const updatedConditionPayloads = (experiment.conditionPayloads || []).filter(
      (cp) => cp.parentCondition !== conditionToDelete.id
    );
    const updatedExperiment = { ...experiment, conditionPayloads: updatedConditionPayloads };

    // Reorder the remaining conditions
    const reorderedConditions = updatedConditions.map((c, index) => ({
      ...c,
      order: index + 1,
    }));

    // Check if weights should be redistributed equally
    const weightingMethod = determineWeightingMethod(currentConditions);

    if (weightingMethod === WEIGHTING_METHOD.EQUAL && reorderedConditions.length > 0) {
      distributeWeightsEqually(reorderedConditions);
    }

    this.updateExperimentConditions(updatedExperiment, reorderedConditions);
  }

  /**
   * Common method to update experiment conditions
   */
  private updateExperimentConditions(experiment: Experiment, updatedConditions: ExperimentCondition[]): void {
    const updateRequest: UpdateExperimentConditionsRequest = {
      experiment,
      conditions: updatedConditions,
    };

    this.experimentService.updateExperimentConditions(updateRequest);
  }
}
