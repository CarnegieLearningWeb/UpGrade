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

export interface DecisionPointsTableRowData {
  site: string;
  target: string;
  excludeIfReached: boolean;
  order: number;
}

export interface ConditionsTableRowData {
  conditionCode: string;
  assignmentWeight: string;
  description: string;
  order: number;
}

export interface ExperimentDesignStepperState {
  isAliasTableEditMode: boolean;
  isDecisionPointsTableEditMode: boolean;
  isConditionsTableEditMode: boolean;
  aliasTableEditIndex: number | null;
  decisionPointsTableEditIndex: number | null;
  conditionsTableEditIndex: number | null;
  hasExperimentStepperDataChanged: boolean;
  decisionPointsEditModePreviousRowData: DecisionPointsTableRowData;
  conditionsEditModePreviousRowData: ConditionsTableRowData;
}

export interface State extends AppState {
  experimentDesignStepper: ExperimentDesignStepperState;
}
