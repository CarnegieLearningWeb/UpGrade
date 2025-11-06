import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ExperimentService } from './experiments.service';
import {
  Experiment,
  ExperimentCondition,
  UpdateExperimentConditionsRequest,
  ConditionFormData,
} from './store/experiments.model';

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
