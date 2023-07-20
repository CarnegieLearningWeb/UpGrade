import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.module';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_SORT_AS,
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
  EXPERIMENT_SORT_AS,
  IExperimentSearchParams,
  IExperimentSortParams,
  IExperimentEnrollmentDetailStats,
  DATE_RANGE,
};

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

export enum ExperimentDesignTypes {
  SIMPLE = 'Simple',
  FACTORIAL = 'Factorial',
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

export interface segmentNew {
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
  logging: boolean;
  conditions: ExperimentCondition[];
  partitions: ExperimentDecisionPoint[];
  factors: ExperimentFactor[];
  conditionPayloads: ExperimentConditionPayload[];
  queries: any[];
  stateTimeLogs: ExperimentStateTimeLog[];
  filterMode: FILTER_MODE;
  experimentSegmentInclusion: segmentNew;
  experimentSegmentExclusion: segmentNew;
  groupSatisfied?: number;
  backendVersion: string;
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
  parentCondition: ExperimentCondition;
  decisionPoint: ExperimentDecisionPoint;
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

export interface ExperimentState extends EntityState<Experiment> {
  isLoadingExperiment: boolean;
  isLoadingExperimentDetailStats: boolean;
  isPollingExperimentDetailStats: boolean;
  skipExperiment: number;
  totalExperiments: number;
  searchKey: EXPERIMENT_SEARCH_KEY;
  searchString: string;
  sortKey: EXPERIMENT_SORT_KEY;
  sortAs: EXPERIMENT_SORT_AS;
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

export interface InteractionEffectGraphData {
  name: string;
  series: InteractionEffectLineChartSeriesData[];
  dot: boolean;
}
