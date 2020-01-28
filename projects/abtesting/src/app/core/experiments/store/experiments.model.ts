import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.module';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  IExperimentEnrollmentStats
} from 'ees_types';

export {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE,
  IExperimentEnrollmentStats
};

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
  EXPERIMENT_SCHEDULE = 'Experiment Schedule'
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

export interface EnrollmentCompleteCondition {
  userCount: number;
  groupCount: number;
}

export interface EnrollmentByConditionData {
  condition: string;
  weight: number;
  userEnrolled: number;
  userExcluded: number;
  classesEnrolled: number;
  classesExcluded: number;
}

export interface ExperimentCondition {
  id: string;
  name: string;
  description: string;
  conditionCode: string;
  assignmentWeight: number;
}

export interface ExperimentPartition {
  id: string;
  point: string;
  name: string;
  description: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  state: EXPERIMENT_STATE;
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
}

export interface ExperimentVM extends Experiment {
  stat: IExperimentEnrollmentStats
}

export interface ExperimentState extends EntityState<Experiment> {
  isLoadingExperiment: boolean;
  stats: {
    [key: string]: IExperimentEnrollmentStats
  }
}

export interface State extends AppState {
  experiments: ExperimentState;
}
