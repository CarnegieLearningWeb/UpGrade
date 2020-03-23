import { EXPERIMENT_STATE } from './enums';
export interface IEnrollmentCompleteCondition {
  userCount: number;
  groupCount: number;
}

interface IConditionEnrollmentStats {
  id: string;
  user: number;
  group: number;
}

interface IPartitionEnrollmentStats {
  id: string;
  user: number;
  group: number;
  conditions: IConditionEnrollmentStats[];
}

export interface IExperimentEnrollmentStats {
  id: string;
  users: number;
  group: number;
  userExcluded: number;
  groupExcluded?: number;
  conditions: IConditionEnrollmentStats[];
  partitions: IPartitionEnrollmentStats[];
}

export interface IExperimentAssignment {
  name: string;
  point: string;
  twoCharacterId: string;
  assignedCondition: {
    conditionCode: string;
    twoCharacterId: string;
  };
}

interface ExperimentCreatedData {
  experimentId: string;
  experimentName: string;
}

interface ExperimentUpdatedData {
  experimentId: string;
  experimentName: string;
  diff: string;
}

interface ExperimentStateChangedData {
  experimentId: string;
  experimentName: string;
  previousState: EXPERIMENT_STATE;
  newState: EXPERIMENT_STATE;
  startOn?: Date;
}

interface ExperimentDeletedData {
  experimentName: string;
}

export type AuditLogData =
  | ExperimentCreatedData
  | ExperimentUpdatedData
  | ExperimentStateChangedData
  | ExperimentDeletedData;
