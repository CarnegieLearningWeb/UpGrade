import { EXPERIMENT_STATE, EXPERIMENT_SEARCH_KEY, EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_AS, IMetricMetaData } from './enums';
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
  expId: string;
  expPoint: string;
  twoCharacterId: string;
  description: string;
  assignedCondition: {
    conditionCode: string;
    twoCharacterId: string;
    description: string;
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

export interface IExperimentSearchParams {
  key: EXPERIMENT_SEARCH_KEY;
  string: string;
}

export interface IExperimentSortParams {
  key: EXPERIMENT_SORT_KEY;
  sortAs: EXPERIMENT_SORT_AS;
}

export interface IExperimentDateStat {
  userId: string;
  groupId: string | undefined;
  conditionId: string;
  partitionIds: string[];
  createdAt: any;
}

export interface IMetricUnit {
  key: string | string[];
  children?: IMetricUnit[];
  metadata?: { type: IMetricMetaData };
  allowedData?: string[];
}

export interface IFlagVariation {
  id: string;
  value: string;
  name: string;
  description: string;
  defaultVariation: boolean[];
}

export interface IFeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  variationType: string;
  status: boolean;
  variations: IFlagVariation[];
}