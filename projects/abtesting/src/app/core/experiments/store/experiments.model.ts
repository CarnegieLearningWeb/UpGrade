import { EntityState } from '@ngrx/entity';
import { AppState } from '../../core.module';
import {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE
} from 'ees_types';

export {
  CONSISTENCY_RULE,
  ASSIGNMENT_UNIT,
  POST_EXPERIMENT_RULE,
  EXPERIMENT_STATE
};

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
