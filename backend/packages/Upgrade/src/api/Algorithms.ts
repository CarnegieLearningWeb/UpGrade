import seedrandom from 'seedrandom';
import { ConditionPayloadDTO } from './DTO/ConditionPayloadDTO';
import { Experiment } from './models/Experiment';
import { CONDITION_ORDER, EXPERIMENT_TYPE, IExperimentAssignmentv5, AssignedCondition, IPayload } from 'upgrade_types';
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
  const assignedData = convertToAssignedCondition(experiment, conditionPayloads, site, target, factors);
  let assignedConditionsArray = assignedData;
  if (assignedData.assignedCondition.length > 1) {
    if (experiment.conditionOrder === CONDITION_ORDER.RANDOM) {
      assignedConditionsArray = randomCondition(experiment, assignedData, userID, monitoredDecisionPointLogsLength);
    } else if (experiment.conditionOrder === CONDITION_ORDER.RANDOM_ROUND_ROBIN) {
      assignedConditionsArray = randomRoundRobinCondition(
        experiment,
        assignedData,
        userID,
        monitoredDecisionPointLogsLength
      );
    } else if (experiment.conditionOrder === CONDITION_ORDER.ORDERED_ROUND_ROBIN) {
      assignedConditionsArray = rotateElements(assignedData, monitoredDecisionPointLogsLength);
    }
  }
  return assignedConditionsArray;
}

export function randomCondition(
  experiment,
  assignedData: IExperimentAssignmentv5,
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  const randomConditionArray: AssignedCondition[] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
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

  return rotateElements(randomAssignData, monitoredDecisionPointLogsLength);
}

export function randomRoundRobinCondition(
  experiment,
  assignedData: IExperimentAssignmentv5,
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  const randomRoundRobinConditionArray: AssignedCondition[] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
  const totalLoopsInQueue = Math.ceil(100 / assignedData.assignedCondition.length);
  for (let i = 0; i < totalLoopsInQueue; i++) {
    const tempConditionArray: AssignedCondition[] = [...assignedData.assignedCondition];
    const tempFactorArray = EXPERIMENT_TYPE.FACTORIAL ? [...assignedData.assignedFactor] : undefined;
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

  return rotateElements(randomRoundRobinAssignData, monitoredDecisionPointLogsLength);
}

export function orderedRoundRobinCondition(
  experiment,
  assignedData: IExperimentAssignmentv5,
  userID: string,
  monitoredDecisionPointLogsLength: number
): IExperimentAssignmentv5 {
  const orderedRoundRobinConditionArray: AssignedCondition[] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
  const tempConditionArray: AssignedCondition[] = [...assignedData.assignedCondition];
  const tempFactorArray = EXPERIMENT_TYPE.FACTORIAL ? [...assignedData.assignedFactor] : undefined;
  for (let i = 0; i < assignedData.assignedCondition.length; i++) {
    const uniqueIdentifier: string = experiment.id + userID + i;
    const randomConditionIndex = Math.floor(seedrandom(uniqueIdentifier)() * tempConditionArray.length);
    const randomCondition = tempConditionArray[randomConditionIndex];
    orderedRoundRobinConditionArray.push(randomCondition);
    tempConditionArray.splice(randomConditionIndex, 1);
    if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
      const randomFactor = tempFactorArray[randomConditionIndex];
      assignedFactorsArray.push(randomFactor);
      tempFactorArray.splice(randomConditionIndex, 1);
    }
  }

  const orderedRoundRobinAssignData = {
    site: assignedData.site,
    target: assignedData.target,
    assignedCondition: orderedRoundRobinConditionArray,
    assignedFactor: experiment.type === EXPERIMENT_TYPE.FACTORIAL ? assignedFactorsArray : null,
  };

  return rotateElements(orderedRoundRobinAssignData, monitoredDecisionPointLogsLength);
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
  const assignedConditionArray: AssignedCondition[] = [];
  const assignedFactorsArray: Record<string, { level: string; payload: IPayload }>[] = [];
  experiment.conditions.forEach((condition) => {
    let conditionPayload: ConditionPayloadDTO = null;
    let factorialObject;
    if (experiment.type === EXPERIMENT_TYPE.FACTORIAL) {
      // returns factorial alias condition or assigned condition
      conditionPayload = conditionPayloads.find((cP) => cP.parentCondition.id === condition.id);
      factorialObject = getFactorialCondition(condition, factors);
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

function getFactorialCondition(conditionAssigned: ExperimentCondition, factors: FactorDTO[]): object {
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
