import seedrandom from 'seedrandom';
import { ConditionPayloadDTO } from './DTO/ConditionPayloadDTO';
import { Experiment } from './models/Experiment';
import { CONDITION_ORDER, EXPERIMENT_TYPE, IExperimentAssignmentv5, IPayload } from 'upgrade_types';
import { FactorDTO } from './DTO/FactorDTO';
import { ExperimentCondition } from './models/ExperimentCondition';

export function withInSubjectType(
  experiment: Experiment,
  conditionPayloads: ConditionPayloadDTO[],
  site: string,
  target: string,
  factors: FactorDTO[],
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  let assignedData = convertToAssignedCondition(experiment, conditionPayloads, site, target, factors);

  // passing assigned conditions data converted into queue based on selected algorithm
  if (assignedData.assignedCondition.length > 1) {
    switch (experiment.conditionOrder) {
      case CONDITION_ORDER.RANDOM: {
        assignedData = randomCondition(experiment, assignedData, userID, monitoredDecisionPointLogsLength);
        break;
      }
      case CONDITION_ORDER.RANDOM_ROUND_ROBIN: {
        assignedData = randomRoundRobinCondition(experiment, assignedData, userID, monitoredDecisionPointLogsLength);
        break;
      }
      case CONDITION_ORDER.ORDERED_ROUND_ROBIN: {
        assignedData = rotateElements(assignedData, monitoredDecisionPointLogsLength);
        break;
      }
      default: {
        break;
      }
    }
  }

  return assignedData;
}

export function randomCondition(
  experiment,
  assignedData: IExperimentAssignmentv5,
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  const randomConditionArray: IExperimentAssignmentv5['assignedCondition'] = [];
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

  const randomAssignData = {
    site: assignedData.site,
    target: assignedData.target,
    assignedCondition: randomConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
  };

  // rotate elements in assigned condition array based on number of monitored decision point
  return rotateElements(randomAssignData, monitoredDecisionPointLogsLength);
}

export function randomRoundRobinCondition(
  experiment,
  assignedData: IExperimentAssignmentv5,
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  const randomRoundRobinConditionArray: IExperimentAssignmentv5['assignedCondition'] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
  const totalLoopsInQueue = Math.ceil(100 / assignedData.assignedCondition.length);

  // create array of random ordered conditions pairs
  for (let i = 0; i < totalLoopsInQueue; i++) {
    const tempConditionArray: IExperimentAssignmentv5['assignedCondition'] = [...assignedData.assignedCondition];
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

  const randomRoundRobinAssignData = {
    site: assignedData.site,
    target: assignedData.target,
    assignedCondition: randomRoundRobinConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
  };

  // rotate elements in assigned condition array based on number of monitored decision point
  return rotateElements(randomRoundRobinAssignData, monitoredDecisionPointLogsLength);
}

export function rotateElements(
  assignedData: IExperimentAssignmentv5,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  if (monitoredDecisionPointLogsLength > 0 && assignedData.assignedCondition.length >= 2) {
    const totalloopIteration = monitoredDecisionPointLogsLength % assignedData.assignedCondition.length;

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

function convertToAssignedCondition(
  experiment: Experiment,
  conditionPayloads: ConditionPayloadDTO[],
  site: string,
  target: string,
  factors: FactorDTO[]
): IExperimentAssignmentv5 {
  const assignedConditionArray: IExperimentAssignmentv5['assignedCondition'] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];

  experiment.conditions.forEach((condition) => {
    let conditionPayload: ConditionPayloadDTO = null;
    let factorialObject;

    if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
      // returns factorial alias condition or assigned condition
      conditionPayload = conditionPayloads.find((cP) => cP.parentCondition.id === condition.id);
      factorialObject = getAssignedFactor(condition, factors);
    } else {
      // checking alias condition for simple experiment
      conditionPayload = conditionPayloads.find(
        (cP) =>
          cP.parentCondition.id === condition.id && cP.decisionPoint.site === site && cP.decisionPoint.target === target
      );
    }

    const assignedCondition = {
      conditionCode: condition.conditionCode,
      payload: conditionPayload?.payload,
      experimentId: experiment.id,
      id: condition.id,
    };
    assignedConditionArray.push(assignedCondition);
    factorialObject ? assignedFactorsArray.push(factorialObject) : null;
  });

  return {
    site: site,
    target: target,
    assignedCondition: assignedConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
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
