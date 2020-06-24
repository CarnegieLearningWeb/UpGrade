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
  IExperimentEnrollmentDetailDateStats
} from 'upgrade_types';

export {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
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

export enum GroupTypes {
  CLASS = 'class',
  SCHOOL = 'school',
  DISTRICT = 'district',
  OTHER = 'Other'
}

export enum NewExperimentDialogEvents {
  CLOSE_DIALOG = 'Close Dialog',
  SEND_FORM_DATA = 'Send Form Data',
  UPDATE_EXPERIMENT = 'Update experiment'
}

export enum NewExperimentPaths {
  EXPERIMENT_OVERVIEW = 'Experiment Overview',
  EXPERIMENT_DESIGN = 'Experiment Design',
  EXPERIMENT_SCHEDULE = 'Experiment Schedule',
  POST_EXPERIMENT_RULE = 'Post Experiment Rule'
}

export interface NewExperimentDialogData {
  type: NewExperimentDialogEvents;
  formData?: any;
  path?: NewExperimentPaths;
}

export enum DateType {
  MEDIUM_DATE = 'medium date',
  SHORT_DATE = 'short date'
}

export enum UpsertExperimentType {
  CREATE_NEW_EXPERIMENT = 'Create new experiment',
  UPDATE_EXPERIMENT = 'Update experiment'
}

export enum EndExperimentCondition {
  END_ON_DATE = 'End on Date',
  END_CRITERIA = 'End Criteria'
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
}

export interface ExperimentPartition {
  id: string;
  expPoint: string;
  expId: string;
  description: string;
  twoCharacterId: string;
}

export interface ExperimentNameVM {
  id: string;
  name: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  state: EXPERIMENT_STATE;
  context: string[];
  startOn: string;
  consistencyRule: CONSISTENCY_RULE;
  assignmentUnit: ASSIGNMENT_UNIT;
  postExperimentRule: POST_EXPERIMENT_RULE;
  enrollmentCompleteCondition: EnrollmentCompleteCondition;
  endOn: string;
  revertTo: string;
  tags: string[];
  group: string;
  conditions: ExperimentCondition[];
  partitions: ExperimentPartition[];
  queries: any[];
}

export const NUMBER_OF_EXPERIMENTS = 20;

export interface ExperimentPaginationParams {
  skip: number;
  take: number;
  searchParams?: IExperimentSearchParams;
  sortParams?: IExperimentSortParams;
}

export interface IExperimentGraphInfo {
  [DATE_RANGE.LAST_SEVEN_DAYS]: IEnrollmentStatByDate[],
  [DATE_RANGE.LAST_THREE_MONTHS]: IEnrollmentStatByDate[],
  [DATE_RANGE.LAST_SIX_MONTHS]: IEnrollmentStatByDate[],
  [DATE_RANGE.LAST_TWELVE_MONTHS]: IEnrollmentStatByDate[],
}

export interface ExperimentVM extends Experiment {
  stat: IExperimentEnrollmentDetailStats;
}

export interface ExperimentState extends EntityState<Experiment> {
  isLoadingExperiment: boolean;
  skipExperiment: number;
  totalExperiments: number;
  searchKey: EXPERIMENT_SEARCH_KEY;
  searchString: string;
  sortKey: EXPERIMENT_SORT_KEY;
  sortAs: EXPERIMENT_SORT_AS;
  stats: {
    [key: string]: IExperimentEnrollmentDetailStats;
  };
  graphInfo: IExperimentGraphInfo,
  graphRange: DATE_RANGE;
  isGraphInfoLoading: boolean;
  allPartitions: {};
  allExperimentNames: {};
  context: string[]
}

export interface State extends AppState {
  experiments: ExperimentState;
}
