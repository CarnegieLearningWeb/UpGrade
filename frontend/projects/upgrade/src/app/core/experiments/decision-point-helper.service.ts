import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

import { ExperimentService } from './experiments.service';
import {
  Experiment,
  ExperimentDecisionPoint,
  UpdateExperimentDecisionPointsRequest,
  DecisionPointFormData,
} from './store/experiments.model';

@Injectable({
  providedIn: 'root',
})
export class DecisionPointHelperService {
  constructor(private experimentService: ExperimentService) {}

  /**
   * Add a new decision point to an experiment
   */
  addDecisionPoint(experiment: Experiment, decisionPointData: DecisionPointFormData): void {
    const currentDecisionPoints = [...(experiment.partitions || [])];
    const newDecisionPoint = {
      id: uuidv4(),
      site: decisionPointData.site,
      target: decisionPointData.target,
      description: '',
      order: currentDecisionPoints.length + 1,
      excludeIfReached: decisionPointData.excludeIfReached,
    };

    const updatedDecisionPoints = [...currentDecisionPoints, newDecisionPoint] as ExperimentDecisionPoint[];

    this.updateExperimentDecisionPoints(experiment, updatedDecisionPoints);
  }

  /**
   * Update an existing decision point in an experiment
   */
  updateDecisionPoint(
    experiment: Experiment,
    sourceDecisionPoint: ExperimentDecisionPoint,
    decisionPointData: DecisionPointFormData
  ): void {
    const currentDecisionPoints = [...(experiment.partitions || [])];
    const updatedDecisionPoints = currentDecisionPoints.map((dp) =>
      dp.id === sourceDecisionPoint.id
        ? {
            ...dp,
            site: decisionPointData.site,
            target: decisionPointData.target,
            excludeIfReached: decisionPointData.excludeIfReached,
          }
        : dp
    );

    this.updateExperimentDecisionPoints(experiment, updatedDecisionPoints);
  }

  /**
   * Delete a decision point from an experiment
   */
  deleteDecisionPoint(experiment: Experiment, decisionPointToDelete: ExperimentDecisionPoint): void {
    const currentDecisionPoints = [...(experiment.partitions || [])];
    const updatedDecisionPoints = currentDecisionPoints.filter((dp) => dp.id !== decisionPointToDelete.id);

    // Reorder the remaining decision points
    const reorderedDecisionPoints = updatedDecisionPoints.map((dp, index) => ({
      ...dp,
      order: index + 1,
    }));

    this.updateExperimentDecisionPoints(experiment, reorderedDecisionPoints);
  }

  /**
   * Common method to update experiment decision points
   */
  private updateExperimentDecisionPoints(
    experiment: Experiment,
    updatedDecisionPoints: ExperimentDecisionPoint[]
  ): void {
    const updateRequest: UpdateExperimentDecisionPointsRequest = {
      experiment,
      decisionPoints: updatedDecisionPoints,
    };

    this.experimentService.updateExperimentDecisionPoints(updateRequest);
  }
}
