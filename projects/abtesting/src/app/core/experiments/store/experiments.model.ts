import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.module';

export enum EXPERIMENT_STATE {
  INACTIVE = 'inactive',
  DEMO = 'demo',
  SCHEDULED = 'scheduled',
  ENROLLING = 'enrolling',
  ENROLLMENT_COMPLETE = 'enrollmentComplete',
  CANCELLED = 'cancelled'
}

export enum CONSISTENCY_RULE {
  INDIVIDUAL = 'individual',
  EXPERIMENT = 'experiment',
  GROUP = 'group'
}

export enum ASSIGNMENT_UNIT {
  INDIVIDUAL = 'individual',
  GROUP = 'group'
}

export enum POST_EXPERIMENT_RULE {
  CONTINUE = 'continue',
  REVERT_TO_DEFAULT = 'revertToDefault'
}

export interface ExperimentCondition {
  id: string;
  name: string;
  description: string;
  conditionCode: string;
  assignmentWeight: number;
}

export interface ExperimentSegment {
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
  consistencyRule: CONSISTENCY_RULE;
  assignmentUnit: ASSIGNMENT_UNIT;
  postExperimentRule: POST_EXPERIMENT_RULE;
  group: string;
  tags: string[];
  conditions: ExperimentCondition[];
  segments: ExperimentSegment[];
}

export interface ExperimentState extends EntityState<Experiment> {
  isLoadingExperiment: boolean;
}

export interface State extends AppState {
  experiments: ExperimentState;
}
