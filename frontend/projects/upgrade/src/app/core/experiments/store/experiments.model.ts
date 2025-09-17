import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.module';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  SORT_AS_DIRECTION,
  EXPERIMENT_STATE,
  IExperimentEnrollmentStats,
  IExperimentSearchParams,
  IExperimentSortParams,
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
  IExperimentEnrollmentDetailDateStats,
  FILTER_MODE,
  EXPERIMENT_TYPE,
  PAYLOAD_TYPE,
  CONDITION_ORDER,
  ASSIGNMENT_ALGORITHM,
  MoocletTSConfigurablePolicyParametersDTO,
  MoocletPolicyParametersDTO,
  REPEATED_MEASURE,
  SEGMENT_TYPE,
  IEnrollmentCompleteCondition,
} from 'upgrade_types';
import { Segment } from '../../segments/store/segments.model';

export {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  CONDITION_ORDER,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  IExperimentEnrollmentStats,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  SORT_AS_DIRECTION,
  IExperimentSearchParams,
  IExperimentSortParams,
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
};

export interface ExperimentConditionFilterOptions {
  code: string;
  id: string;
}

export interface ExperimentPartitionFilterOptions {
  id: string;
  point: string;
  twoCharacterId: string;
}

export interface ExperimentDateFilterOptions {
  value: DATE_RANGE;
  viewValue: string;
}

export interface IEnrollmentStatByDate {
  date: string;
  stats: IExperimentEnrollmentDetailDateStats;
}

export enum NewExperimentDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_EXPERIMENT = 'Update experiment',
  SAVE_DATA = 'Save Data',
}

export enum NewExperimentPaths {
  EXPERIMENT_OVERVIEW = 'Experiment Overview',
  EXPERIMENT_DESIGN = 'Experiment Design',
  EXPERIMENT_PARTICIPANTS = 'Experiment Participants',
  MONITORED_METRIC = 'Monitored Metric',
  EXPERIMENT_SCHEDULE = 'Experiment Schedule',
  POST_EXPERIMENT_RULE = 'Post Experiment Rule',
}

export enum OverviewFormWarningStatus {
  NO_WARNING = 'no warning',
  CONTEXT_CHANGED = 'context changed',
  DESIGN_TYPE_CHANGED = 'design type changed',
}

export interface NewExperimentDialogData {
  type: NewExperimentDialogEvents;
  formData?: any;
  path?: NewExperimentPaths;
}

export enum DateType {
  MEDIUM_DATE = 'medium date',
  SHORT_DATE = 'short date',
}

export enum UpsertExperimentType {
  CREATE_NEW_EXPERIMENT = 'Create new experiment',
  UPDATE_EXPERIMENT = 'Update experiment',
  IMPORT_EXPERIMENT = 'Import experiment',
}

export enum EndExperimentCondition {
  END_ON_DATE = 'End on Date',
  END_CRITERIA = 'End Criteria',
}

export enum ExperimentLocalStorageKeys {
  EXPERIMENT_SEARCH_STRING = 'EXPERIMENT_SEARCH_STRING',
  EXPERIMENT_SEARCH_KEY = 'EXPERIMENT_KEY_STRING',
  EXPERIMENT_SORT_KEY = 'EXPERIMENT_SORT_KEY',
  EXPERIMENT_SORT_TYPE = 'EXPERIMENT_SORT_TYPE',
}

export interface ExperimentStateInfo {
  newStatus: EXPERIMENT_STATE;
  scheduleDate?: string;
}

export interface EnrollmentCompleteCondition {
  userCount: number;
  groupCount: number;
}

export interface EnrollmentByConditionOrPartitionData {
  condition?: string;
  weight?: number;
  userEnrolled: number;
  groupEnrolled: number;
  experimentPoint?: string;
  experimentId?: string;
}

export interface ExperimentCondition {
  id: string;
  name: string;
  description: string;
  conditionCode: string;
  assignmentWeight: number;
  twoCharacterId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  levelCombinationElements?: LevelCombinationElement[];
}

export interface ExperimentConditionForSimpleExp {
  id: string;
  name: string;
  description: string;
  conditionCode: string;
  assignmentWeight: number;
  twoCharacterId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
}

export interface LevelCombinationElement {
  id: string;
  level: ExperimentLevel;
}

export interface ExperimentDecisionPoint {
  id: string;
  site: string;
  target: string;
  description: string;
  twoCharacterId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  excludeIfReached: boolean;
}

export interface ExperimentFactor {
  name: string;
  description: string;
  order: number;
  levels: ExperimentLevel[];
}

export interface LevelsMap {
  [key: string]: ExperimentLevel;
}

export interface ExperimentLevel {
  id: string;
  name: string;
  // payload: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
  order: number;
}

export interface ExperimentNameVM {
  id: string;
  name: string;
}

export interface ExperimentStateTimeLog {
  id: string;
  fromState: EXPERIMENT_STATE;
  toState: EXPERIMENT_STATE;
  timeLog: string;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
}

export interface SegmentNew {
  updatedAt: string;
  createdAt: string;
  versionNumber: number;
  segment: Segment;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  versionNumber: number;
  state: EXPERIMENT_STATE;
  context: string[];
  startOn: string;
  consistencyRule: CONSISTENCY_RULE;
  conditionOrder: CONDITION_ORDER;
  assignmentUnit: ASSIGNMENT_UNIT;
  postExperimentRule: POST_EXPERIMENT_RULE;
  enrollmentCompleteCondition: EnrollmentCompleteCondition;
  endOn: string;
  revertTo: string;
  tags: string[];
  type: EXPERIMENT_TYPE;
  group: string;
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM;
  stratificationFactor?: { stratificationFactorName: string };
  conditions: ExperimentCondition[];
  partitions: ExperimentDecisionPoint[];
  factors: ExperimentFactor[];
  conditionPayloads: ExperimentConditionPayload[];
  queries: any[];
  stateTimeLogs: ExperimentStateTimeLog[];
  filterMode: FILTER_MODE;
  experimentSegmentInclusion: SegmentNew[];
  experimentSegmentExclusion: SegmentNew[];
  groupSatisfied?: number;
  backendVersion: string;
  moocletPolicyParameters?: MoocletTSConfigurablePolicyParametersDTO;
  rewardMetricKey?: string;
}

export interface ParticipantsMember {
  id: string;
  type: string;
}

export interface ExperimentConditionPayload {
  id?: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
  // payload: string;
  parentCondition: string;
  decisionPoint: string;
}

export const NUMBER_OF_EXPERIMENTS = 20;

export interface ExperimentPaginationParams {
  skip: number;
  take: number;
  searchParams?: IExperimentSearchParams;
  sortParams?: IExperimentSortParams;
}

export interface ISingleContextMetadata {
  EXP_IDS: string[];
  EXP_POINTS: string[];
  GROUP_TYPES: string[];
  CONDITIONS: string[];
}
export interface IContextMetaData {
  contextMetadata: Record<string, ISingleContextMetadata>;
}

export interface IExperimentGraphInfo {
  [DATE_RANGE.LAST_SEVEN_DAYS]: IEnrollmentStatByDate[];
  [DATE_RANGE.LAST_THREE_MONTHS]: IEnrollmentStatByDate[];
  [DATE_RANGE.LAST_SIX_MONTHS]: IEnrollmentStatByDate[];
  [DATE_RANGE.LAST_TWELVE_MONTHS]: IEnrollmentStatByDate[];
}

export interface ExperimentVM extends Experiment {
  stat: IExperimentEnrollmentDetailStats;
}

export enum UPSERT_EXPERIMENT_ACTION {
  ADD = 'add',
  EDIT = 'edit',
  DUPLICATE = 'duplicate',
}

export enum EXPERIMENT_BUTTON_ACTION {
  IMPORT = 'import experiment',
  EXPORT_ALL = 'export all experiments',
  IMPORT_INCLUDE_LIST = 'import include list',
  IMPORT_EXCLUDE_LIST = 'import exclude list',
  EXPORT_ALL_INCLUDE_LISTS = 'export all include lists',
  EXPORT_ALL_EXCLUDE_LISTS = 'export all exclude lists',
  IMPORT_DECISION_POINT = 'import decision point',
  EXPORT_ALL_DECISION_POINTS = 'export all decision points',
  IMPORT_CONDITION = 'import condition',
  EXPORT_ALL_CONDITIONS = 'export all conditions',
  IMPORT_METRIC = 'import metric',
  EXPORT_ALL_METRICS = 'export all metrics',
  EXPORT_ENROLLMENT_DATA = 'export enrollment data',
  EXPORT_METRICS_DATA = 'export metrics data',
}

export interface UpsertExperimentParams {
  sourceExperiment: Experiment;
  action: UPSERT_EXPERIMENT_ACTION;
}

export interface ExperimentFormData {
  name: string;
  description: string;
  appContext: string;
  experimentType: EXPERIMENT_TYPE;
  unitOfAssignment: ASSIGNMENT_UNIT;
  consistencyRule: CONSISTENCY_RULE;
  conditionOrder?: CONDITION_ORDER;
  assignmentAlgorithm: ASSIGNMENT_ALGORITHM;
  stratificationFactor?: string;
  groupType?: string;
  tags: string[];
}

// Base interfaces matching backend DTO structure
export interface ExperimentConditionDTO {
  id: string;
  name?: string;
  description?: string;
  conditionCode: string;
  assignmentWeight: number;
  order: number;
  twoCharacterId?: string;
  levelCombinationElements?: LevelCombinationElement[];
}

export interface ExperimentPartitionDTO {
  id: string;
  site: string;
  target?: string;
  description?: string;
  order: number;
  excludeIfReached: boolean;
  twoCharacterId?: string;
}

export interface ExperimentFactorDTO {
  id?: string;
  name: string;
  description?: string;
  order: number;
  levels: ExperimentLevel[];
}

export interface ExperimentConditionPayloadDTO {
  id?: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
  parentCondition: string;
  decisionPoint: string;
}

export interface ExperimentQueryDTO {
  id?: string;
  name: string;
  query: object;
  metric: {
    key: string;
  };
  repeatedMeasure: REPEATED_MEASURE;
}

export interface ExperimentSegmentDTO {
  segment: {
    id?: string;
    name?: string;
    description?: string;
    context?: string;
    type: SEGMENT_TYPE;
    listType?: string;
    individualForSegment?: Array<{ userId: string }>;
    groupForSegment?: Array<{ groupId: string; type: string }>;
    subSegments?: Array<{ id: string }>;
  };
}

export interface ExperimentStateTimeLogDTO {
  id: string;
  fromState: EXPERIMENT_STATE;
  toState: EXPERIMENT_STATE;
  timeLog: string;
}

// Progressive typing for different experiment creation stages
export interface DraftExperimentRequest {
  // Minimum required for saving a draft
  name: string;
  description?: string;
  context: string[];
  type: EXPERIMENT_TYPE;
  assignmentUnit: ASSIGNMENT_UNIT;
  state: EXPERIMENT_STATE;
  filterMode: FILTER_MODE;
  tags: string[];

  // Optional fields that can be filled later
  consistencyRule?: CONSISTENCY_RULE;
  conditionOrder?: CONDITION_ORDER;
  assignmentAlgorithm?: ASSIGNMENT_ALGORITHM;
  stratificationFactor?: { stratificationFactorName: string } | null;
  group?: string;
  postExperimentRule?: POST_EXPERIMENT_RULE;
  enrollmentCompleteCondition?: Partial<IEnrollmentCompleteCondition>;
  startOn?: string;
  endOn?: string;
  revertTo?: string;
  backendVersion?: string;
  moocletPolicyParameters?: MoocletPolicyParametersDTO;
  rewardMetricKey?: string;

  // Arrays that can be empty for drafts
  conditions?: ExperimentConditionDTO[];
  partitions?: ExperimentPartitionDTO[];
  factors?: ExperimentFactorDTO[];
  conditionPayloads?: ExperimentConditionPayloadDTO[];
  queries?: ExperimentQueryDTO[];
  experimentSegmentInclusion?: ExperimentSegmentDTO[];
  experimentSegmentExclusion?: ExperimentSegmentDTO[];
  stateTimeLogs?: ExperimentStateTimeLogDTO[];
}

export interface CompleteExperimentRequest extends DraftExperimentRequest {
  // Required fields for a complete experiment that can be activated
  consistencyRule: CONSISTENCY_RULE; // Required for non-WITHIN_SUBJECTS
  postExperimentRule: POST_EXPERIMENT_RULE;
  conditions: ExperimentConditionDTO[]; // Must have at least one condition
  partitions: ExperimentPartitionDTO[]; // Must have at least one partition
}

// Legacy type alias for backwards compatibility - consider migrating to CompleteExperimentRequest
export type AddExperimentRequest = CompleteExperimentRequest;

// UpdateExperimentRequest should extend CompleteExperimentRequest but add id and handle segment differences
export interface UpdateExperimentRequest
  extends Omit<CompleteExperimentRequest, 'experimentSegmentInclusion' | 'experimentSegmentExclusion'> {
  readonly id: string;
  // These fields might have different structure in updates vs creates
  experimentSegmentInclusion?: SegmentNew[];
  experimentSegmentExclusion?: SegmentNew[];
}

export interface UpdateExperimentFilterModeRequest {
  experiment: Experiment;
  filterMode: FILTER_MODE;
}

export const EXPERIMENT_ROOT_COLUMN_NAMES = {
  NAME: 'name',
  STATUS: 'state',
  UPDATED_AT: 'updatedAt',
  APP_CONTEXT: 'appContext',
  TAGS: 'tags',
  ENROLLMENT: 'enrollment',
};

export const EXPERIMENT_TRANSLATION_KEYS = {
  NAME: 'experiments.global-name.text',
  STATUS: 'experiments.global-status.text',
  UPDATED_AT: 'experiments.global-updated-at.text',
  APP_CONTEXT: 'experiments.global-app-context.text',
  TAGS: 'experiments.global-tags.text',
  ENROLLMENT: 'experiments.global-enrollment.text',
};

export const EXPERIMENT_ROOT_DISPLAYED_COLUMNS = Object.values(EXPERIMENT_ROOT_COLUMN_NAMES);

export interface ExperimentState extends EntityState<Experiment> {
  isLoadingExperiment: boolean;
  isLoadingExperimentDetailStats: boolean;
  isPollingExperimentDetailStats: boolean;
  isLoadingExperimentExport: boolean;
  skipExperiment: number;
  totalExperiments: number;
  searchKey: EXPERIMENT_SEARCH_KEY;
  searchString: string;
  sortKey: EXPERIMENT_SORT_KEY;
  sortAs: SORT_AS_DIRECTION;
  stats: Record<string, IExperimentEnrollmentDetailStats>;
  graphInfo: IExperimentGraphInfo;
  graphRange: DATE_RANGE;
  isGraphInfoLoading: boolean;
  allDecisionPoints: Record<string, ExperimentDecisionPoint>;
  allExperimentNames: ExperimentNameVM[];
  contextMetaData: IContextMetaData;
  isLoadingContextMetaData: boolean;
  currentUserSelectedContext: ISingleContextMetadata;
  updatedStat?: IExperimentEnrollmentDetailStats;
}

export interface State extends AppState {
  experiments: ExperimentState;
}

export interface TableEditModeDetails {
  isEditMode: boolean;
  rowIndex: number | null;
}

export interface SimpleExpMainEffectResult {
  conditionId: string;
  participantsLogged: string;
  result: string;
}

export interface FactorialExpMainEffectResult {
  levelId: string;
  participantsLogged: string;
  result: string;
}

export interface InteractionEffectResult {
  conditionId: string;
  participantsLogged: string;
  result: string;
}
export interface QueryResult {
  id: string;
  interactionEffect: InteractionEffectResult[];
  mainEffect: SimpleExpMainEffectResult[] | FactorialExpMainEffectResult[];
}

export interface MainEffectGraphData {
  name: string;
  value: number;
  extra: number;
}

export interface InteractionEffectLineChartSeriesData {
  name: string;
  value: number;
  participantsLogged: number;
}

export enum EXPERIMENT_ROW_ACTION {
  EDIT = 'edit',
  DELETE = 'delete',
}

export interface ExperimentDecisionPointRowActionEvent {
  action: EXPERIMENT_ROW_ACTION;
  decisionPoint: ExperimentDecisionPoint;
}

export interface ExperimentConditionRowActionEvent {
  action: EXPERIMENT_ROW_ACTION;
  condition: ExperimentCondition;
}

export enum EXPERIMENT_PAYLOAD_DISPLAY_TYPE {
  UNIVERSAL = 'universal',
  SPECIFIC = 'specific',
  NONE = 'none',
}

export interface InteractionEffectGraphData {
  name: string;
  series: InteractionEffectLineChartSeriesData[];
  dot: boolean;
}

export interface RewardMetricData {
  metric_Key: string;
  metric_Operation: string;
  metric_Name: string;
}

export interface ExperimentSegmentListResponse extends SegmentNew {
  experiment: Experiment;
}
