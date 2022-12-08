import { AppState } from '../../core.module';

// in PUT/POST request, parentCondition and decisionPoint are id string
export interface ExperimentConditionAliasRequestObject {
  id?: string;
  aliasName: string;
  parentCondition: string;
  decisionPoint: string;
}

export interface ExperimentAliasTableRow {
  id?: string;
  site: string;
  target: string;
  condition: string;
  alias: string;
  isEditing: boolean;
  rowStyle?: 'odd' | 'even';
}

export interface ExperimentDesignStepperState {
  isAliasTableEditMode: boolean;
  aliasTableEditIndex: number | null;
  hasExperimentStepperDataChanged: boolean;
}

export interface State extends AppState {
  experimentDesignStepper: ExperimentDesignStepperState;
}
