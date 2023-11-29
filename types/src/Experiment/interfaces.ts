import {
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
  IMetricMetaData,
  PAYLOAD_TYPE,
  SUPPORTED_CALIPER_EVENTS,
  SUPPORTED_CALIPER_PROFILES,
} from './enums';
export interface IEnrollmentCompleteCondition {
  userCount: number;
  groupCount: number;
}

interface IConditionEnrollmentStats {
  id: string;
  users: number;
  groups: number;
  partitions: IPartitionEnrollmentStats[];
}

interface IPartitionEnrollmentStats {
  id: string;
  users: number;
  groups: number;
}

export interface IExperimentEnrollmentStats {
  users: number;
  groups: number;
  id: string;
}

export interface IExperimentEnrollmentDetailStats {
  id: string;
  users: number;
  groups: number;
  usersExcluded: number;
  groupsExcluded: number;
  conditions: IConditionEnrollmentStats[];
}

// TODO Delete this after changing in clientSDK
export type INewExperimentAssignment = Pick<IExperimentAssignmentv4, 'assignedCondition'> & {
  target: string;
  site: string;
  experimentId: string;
};

export interface IExperimentAssignmentv4 {
  site: string;
  target: string;
  assignedCondition: AssignedCondition;
  assignedFactor?: Record<string, { level: string; payload: IPayload }>;
}

export interface IExperimentAssignmentv5 {
  site: string;
  target: string;
  assignedCondition: AssignedCondition[];
  assignedFactor?: Record<string, { level: string; payload: IPayload }>[];
}

export interface AssignedCondition {
  conditionCode: string;
  payload: IPayload;
  experimentId?: string;
  id: string;
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

interface IConditionEnrollmentDateStats {
  id: string;
  partitions: IPartitionEnrollmentStats[];
}

export interface IExperimentEnrollmentDetailDateStats {
  id: string;
  conditions: IConditionEnrollmentDateStats[];
}

interface ILogMetrics {
  attributes?: Record<string, string | number>;
  groupedMetrics: ILogGroupMetrics[];
}

interface ILogGroupMetrics {
  groupClass: string;
  groupKey: string;
  groupUniquifier: string;
  attributes?: Record<string, string | number>;
}
export interface ILogInput {
  timestamp: string;
  metrics: ILogMetrics;
}
export interface IGroupMetric {
  groupClass: string;
  allowedKeys: string[];
  attributes: Array<IGroupMetric | ISingleMetric>;
}

export interface ISingleMetric {
  metric: string;
  datatype: IMetricMetaData;
  allowedValues?: Array<string | number>;
}

export interface IGroupMembership {
  id: string;
  group: object;
}

export interface IWorkingGroup {
  id: string;
  workingGroup: object;
}

export interface IUserAliases {
  userId: string;
  aliases: string[];
}

export interface IPayload {
  type: PAYLOAD_TYPE;
  value: string;
}

export interface ScoreObject {
  id: string;
  type: string;
  attempt: Attempt;
  extensions?: object;
  scoreGiven?: number;
}

export interface CaliperActor {
  id: string;
  type: string;
}

export interface Attempt {
  id?: string;
  type: string;
  assignee?: CaliperActor;
  assignable?: CaliperActor;
  duration?: string;
  extensions?: ILogInput;
}

export interface CaliperGradingProfile {
  id: string;
  type: SUPPORTED_CALIPER_EVENTS;
  profile: SUPPORTED_CALIPER_PROFILES;
  actor: CaliperActor;
  action: string;
  object: Attempt;
  generated: ScoreObject;
  extensions: Record<string, unknown>;
  eventTime: string;
}

export interface CaliperEnvelope {
  sensor: string;
  sendTime: string;
  dataVersion: string;
  data: CaliperGradingProfile[];
}
