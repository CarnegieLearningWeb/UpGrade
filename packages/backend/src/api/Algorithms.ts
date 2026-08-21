import seedrandom from 'seedrandom';
import { ConditionPayloadDTO } from './DTO/ConditionPayloadDTO';
import { Experiment } from './models/Experiment';
import { CONDITION_ORDER, EXPERIMENT_TYPE, IExperimentAssignment, IPayload } from 'upgrade_types';
import { FactorDTO } from './DTO/FactorDTO';
import { ExperimentCondition } from './models/ExperimentCondition';
import { DecisionPoint } from './models/DecisionPoint';

export function randomCondition(
  experiment,
  assignedData: IExperimentAssignment,
  userID: string,
  repeatedEnrollmentLength: number
): IExperimentAssignment {
  const randomConditionArray: IExperimentAssignment['assignedCondition'] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];

  // create 100 elements array of random condition
  for (let i = 0; i < 100; i++) {
    const uniqueIdentifier: string = experiment.id + userID + i;
    const randomIndex = Math.floor(seedrandom(uniqueIdentifier)() * assignedData.assignedCondition.length);
    const randomCondition = assignedData.assignedCondition[randomIndex];
    randomConditionArray.push(randomCondition);

    if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
      assignedFactorsArray.push(assignedData.assignedFactor[randomIndex]);
    }
  }

  const randomAssignData: IExperimentAssignment = {
    site: assignedData.site,
    target: assignedData.target,
    assignedCondition: randomConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
    experimentType: experiment.type,
  };

  // rotate elements in assigned condition array based on number of repeated enrollments
  return rotateElements(randomAssignData, repeatedEnrollmentLength);
}

export function randomRoundRobinCondition(
  experiment,
  assignedData: IExperimentAssignment,
  userID: string,
  repeatedEnrollmentLength: number
): IExperimentAssignment {
  const randomRoundRobinConditionArray: IExperimentAssignment['assignedCondition'] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
  const totalLoopsInQueue = Math.ceil(100 / assignedData.assignedCondition.length);

  // create array of random ordered conditions pairs
  for (let i = 0; i < totalLoopsInQueue; i++) {
    const tempConditionArray: IExperimentAssignment['assignedCondition'] = [...assignedData.assignedCondition];
    const tempFactorArray: Record<string, { level: string; payload: IPayload }>[] =
      experiment.type === EXPERIMENT_TYPE.FACTORIAL ? [...assignedData.assignedFactor] : [];

    for (let j = 0; j < assignedData.assignedCondition.length; j++) {
      const uniqueIdentifier: string = experiment.id + userID + i + j;
      const randomConditionIndex = Math.floor(seedrandom(uniqueIdentifier)() * tempConditionArray.length);
      const randomCondition = tempConditionArray[randomConditionIndex];
      randomRoundRobinConditionArray.push(randomCondition);
      tempConditionArray.splice(randomConditionIndex, 1);

      if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
        const randomFactor = tempFactorArray[randomConditionIndex];
        assignedFactorsArray.push(randomFactor);
        tempFactorArray.splice(randomConditionIndex, 1);
      }
    }
  }

  const randomRoundRobinAssignData: IExperimentAssignment = {
    site: assignedData.site,
    target: assignedData.target,
    assignedCondition: randomRoundRobinConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
    experimentType: experiment.type,
  };

  // rotate elements in assigned condition array based on number of repeated enrollments
  return rotateElements(randomRoundRobinAssignData, repeatedEnrollmentLength);
}

export function rotateElements(
  assignedData: IExperimentAssignment,
  repeatedEnrollmentLength: number
): IExperimentAssignment {
  if (repeatedEnrollmentLength > 0 && assignedData.assignedCondition.length >= 2) {
    const totalloopIteration = repeatedEnrollmentLength % assignedData.assignedCondition.length;

    for (let i = 0; i < totalloopIteration; i++) {
      const assignedCondition = assignedData.assignedCondition.shift();
      assignedData.assignedCondition.push(assignedCondition);

      if (assignedData.assignedFactor) {
        const assignedFactor = assignedData.assignedFactor.shift();
        assignedData.assignedFactor.push(assignedFactor);
      }
    }
  }
  return assignedData;
}

/**
 * Pre-computes the ordered condition/factor arrays for a within-subjects experiment
 * without decision-point-specific payloads. Call once per experiment+user, then pass the
 * result to withInSubjectTypeFromPrecomputed for each decision point to avoid repeating
 * the expensive ~100-iteration seedrandom loop N times.
 */
export function buildWithinSubjectOrderedConditions(
  experiment: Experiment,
  factors: FactorDTO[],
  userId: string,
  repeatedEnrollmentLength: number
): {
  orderedConditions: IExperimentAssignment['assignedCondition'];
  orderedFactors: Record<string, { level: string; payload: IPayload }>[] | null;
} {
  // Order matters here: ORDERED_ROUND_ROBIN rotates this array directly, and the RANDOM /
  // RANDOM_ROUND_ROBIN shuffles are seeded, so their output depends on the input sequence too.
  // `getValidExperiments` (the assignment read path) does not ORDER BY conditions.order — only
  // `findOneExperiment` does — so sort explicitly rather than inheriting whatever order the DB
  // returned. Sort a copy: `experiment.conditions` can be the array owned by the in-memory cache.
  const orderedExperimentConditions = [...experiment.conditions].sort(
    (condition1, condition2) => condition1.order - condition2.order
  );

  const baseConditions: IExperimentAssignment['assignedCondition'] = orderedExperimentConditions.map((condition) => ({
    conditionCode: condition.conditionCode,
    payload: undefined,
    experimentId: experiment.id,
    id: condition.id,
  }));

  const baseFactors: Record<string, { level: string; payload: IPayload }>[] | null =
    experiment.type === EXPERIMENT_TYPE.FACTORIAL
      ? orderedExperimentConditions.map((condition) => getAssignedFactor(condition, factors))
      : null;

  let assignedData: IExperimentAssignment = {
    site: '',
    target: '',
    assignedCondition: baseConditions,
    assignedFactor: baseFactors,
    experimentType: experiment.type,
  };

  if (baseConditions.length > 1) {
    switch (experiment.conditionOrder) {
      case CONDITION_ORDER.RANDOM:
        assignedData = randomCondition(experiment, assignedData, userId, repeatedEnrollmentLength);
        break;
      case CONDITION_ORDER.RANDOM_ROUND_ROBIN:
        assignedData = randomRoundRobinCondition(experiment, assignedData, userId, repeatedEnrollmentLength);
        break;
      case CONDITION_ORDER.ORDERED_ROUND_ROBIN:
        assignedData = rotateElements(assignedData, repeatedEnrollmentLength);
        break;
      default:
        break;
    }
  }

  return {
    orderedConditions: assignedData.assignedCondition,
    orderedFactors: assignedData.assignedFactor,
  };
}

/**
 * Applies decision-point-specific payloads to a pre-computed within-subjects condition order
 * and returns the final assignment for one decision point. Pair with
 * buildWithinSubjectOrderedConditions + a conditionPayloadMap built once per experiment.
 */
export function withInSubjectTypeFromPrecomputed(
  experiment: Experiment,
  orderedConditions: IExperimentAssignment['assignedCondition'],
  orderedFactors: Record<string, { level: string; payload: IPayload }>[] | null,
  conditionPayloadMap: Map<string, ConditionPayloadDTO>,
  decisionPoint: DecisionPoint
): IExperimentAssignment {
  const isFactorial = experiment.type === EXPERIMENT_TYPE.FACTORIAL;

  const assignedCondition = orderedConditions.map((condition) => {
    const key = isFactorial ? condition.id : `${condition.id}:${decisionPoint.id}`;
    return {
      ...condition,
      payload: conditionPayloadMap.get(key)?.payload,
    };
  });

  return {
    site: decisionPoint.site,
    target: decisionPoint.target,
    assignedCondition,
    assignedFactor: orderedFactors,
    experimentType: experiment.type,
  };
}

function getAssignedFactor(
  conditionAssigned: ExperimentCondition,
  factors: FactorDTO[]
): Record<string, { level: string; payload: IPayload }> {
  const levelsForCondition: string[] = [];
  conditionAssigned.levelCombinationElements.forEach((element) => {
    levelsForCondition.push(element.level.id);
  });

  const levelsForDecisionPoint = [];
  factors.forEach((factor) => {
    factor.levels.forEach((level) => {
      levelsForDecisionPoint.push({ ...level, factorName: factor.name, order: factor.order });
    });
  });

  const conditionCodeToSet = levelsForDecisionPoint
    .filter((value) => levelsForCondition.includes(value.id))
    .sort((a, b) => a.order - b.order);

  const assignedFactor = {};
  conditionCodeToSet.forEach((x) => {
    assignedFactor[x.factorName] = { level: x.name, payload: { type: x.payload.type, value: x.payload.value } };
  });

  return assignedFactor;
}
