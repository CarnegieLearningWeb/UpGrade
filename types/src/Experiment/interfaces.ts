import {
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  SORT_AS_DIRECTION,
  IMetricMetaData,
  PAYLOAD_TYPE,
  SUPPORTED_CALIPER_EVENTS,
  SUPPORTED_CALIPER_PROFILES,
  EXPERIMENT_TYPE,
  FEATURE_FLAG_LIST_OPERATION,
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  FEATURE_FLAG_LIST_FILTER_MODE,
  IMPORT_COMPATIBILITY_TYPE,
  SERVER_ERROR,
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

export interface IExperimentAssignmentv5 {
  site: string;
  target: string;
  assignedCondition: AssignedCondition[];
  assignedFactor?: Record<string, { level: string; payload: IPayload }>[];
  experimentType: EXPERIMENT_TYPE;
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

export interface FeatureFlagCreatedData {
  flagId: string;
  flagName: string;
}

export interface FeatureFlagUpdatedData {
  flagId: string;
  flagName: string;
  filterMode?: FILTER_MODE;
  list?: ListOperationsData;
  diff?: string;
}

export interface ListOperationsData {
  listId: string;
  listName: string;
  filterType: FEATURE_FLAG_LIST_FILTER_MODE;
  operation: FEATURE_FLAG_LIST_OPERATION;
  enabled?: boolean;
  diff?: string;
}

export interface FeatureFlagStateChangedData {
  flagId: string;
  flagName: string;
  previousState: FEATURE_FLAG_STATUS;
  newState: FEATURE_FLAG_STATUS;
}

export interface FeatureFlagDeletedData {
  flagName: string;
}

export type AuditLogData =
  | ExperimentCreatedData
  | ExperimentUpdatedData
  | ExperimentStateChangedData
  | ExperimentDeletedData
  | FeatureFlagCreatedData
  | FeatureFlagUpdatedData
  | FeatureFlagStateChangedData
  | FeatureFlagDeletedData;

export interface IExperimentSearchParams {
  key: EXPERIMENT_SEARCH_KEY;
  string: string;
}

export interface IExperimentSortParams {
  key: EXPERIMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
}

export interface IMetricUnit {
  key: string | string[];
  context?: string[];
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
  context: string[];
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

export interface ILogMetrics {
  attributes?: Record<string, string | number>;
  groupedMetrics: ILogGroupMetrics[];
}

export interface ILogGroupMetrics {
  groupClass: string;
  groupKey: string;
  groupUniquifier: string;
  attributes?: Record<string, string | number>;
}

export interface ILogRequestBody {
  userId?: string;
  value?: ILogInput[];
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

export interface IUserAliasesv6 {
  aliases: string[];
}

export interface IUserAliases extends IUserAliasesv6 {
  userId: string;
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

export interface IMenuButtonItem {
  action: string;
  label: string; // transalation key
  disabled: boolean;
}

export interface IFeatureFlagFile {
  fileName: string;
  fileContent: string | ArrayBuffer;
}

export interface IImportError {
  fileName: string;
  error: string | null;
}

export interface ValidatedImportResponse {
  fileName: string;
  compatibilityType: IMPORT_COMPATIBILITY_TYPE;
  error?: string;
}

export interface DuplicateSegmentNameError {
  type: SERVER_ERROR.SEGMENT_DUPLICATE_NAME;
  message: string;
  duplicateName: string;
  context: string;
  httpCode: 400;
}
