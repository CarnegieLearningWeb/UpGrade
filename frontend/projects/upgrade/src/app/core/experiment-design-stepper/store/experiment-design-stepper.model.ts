import { AppState } from '../../core.module';
import { ExperimentCondition, ExperimentDecisionPoint } from '../../experiments/store/experiments.model';

// in PUT/POST request, parentCondition and decisionPoint are id string
export interface ExperimentConditionAliasRequestObject {
  id?: string;
  aliasName: string;
  parentCondition: string;
  decisionPoint?: string;
}

export interface FactorialConditionRequestObject {
  id: string;
  name: string;
  conditionCode: string;
  assignmentWeight: number;
  order: number;
  levelCombinationElements: { id: string; level: FactorialLevelTableRowData }[];
}
export interface SimpleExperimentAliasTableRowData {
  id?: string;
  designTableCombinationId?: string;
  site: string;
  target: string;
  condition: string;
  alias: string;
  rowStyle?: string;
  useCustom?: boolean;
}

export interface SimpleExperimentFormData {
  // Why are there 2 set of same entity?
  decisionPoints?: SimpleExperimentFormDecisionPoints[];
  partitions?: SimpleExperimentFormDecisionPoints[];
  conditions: SimpleExperimentFormDecisionConditions[];
}

export interface SimpleExperimentFormDecisionPoints {
  site: string;
  target: string;
  excludeIfReached: string;
  order: number;
}

export interface SimpleExperimentFormDecisionConditions {
  conditionCode: string;
  assignmentWeight: string;
  description: string;
  order: number;
}

export interface SimpleExperimentDesignData {
  decisionPoints: ExperimentDecisionPoint[];
  conditions: ExperimentCondition[];
  // TODO: add factors
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

export interface FactorialConditionTableRowData {
  id: string;
  conditionAliasId?: string;
  levels: FactorialLevelTableRowData[];
  condition: string;
  alias: string;
  weight: string;
  include: boolean;
}

export interface FactorialFactorTableRowData {
  id: string;
  name: string;
  description: string;
  levels: FactorialLevelTableRowData[];
}
export interface FactorialLevelTableRowData {
  id: string;
  name: string;
  payload: string;
}

export interface ExperimentFactorialDesignData {
  factors: ExperimentFactorFormData[];
}

export interface ExperimentFactorialLevelDesignData {
  levels: FactorialLevelTableRowData[];
}

export interface ExperimentFactorFormData {
  name: string;
  description: string;
  order: number;
  levels: FactorialLevelTableRowData[];
}

export interface ExperimentDesignStepperState {

  hasExperimentStepperDataChanged: boolean;

  simpleExperimentDesignData: SimpleExperimentDesignData;
  factorialExperimentDesignData: ExperimentFactorialDesignData;
  simpleExperimentAliasTableData: SimpleExperimentAliasTableRowData[];
  factorialConditionsTableData: FactorialConditionTableRowData[];
  factorialLevelsTableData: FactorialLevelTableRowData[];
  factorialFactorsTableData: FactorialFactorTableRowData[];

  // Alias Table
  isSimpleExperimentAliasTableEditMode: boolean;
  simpleExperimentAliasTableEditIndex: number | null;

  // Decision Point Table
  isDecisionPointsTableEditMode: boolean;
  decisionPointsTableEditIndex: number | null;
  decisionPointsEditModePreviousRowData: DecisionPointsTableRowData;

  // Condition Table
  isConditionsTableEditMode: boolean;
  conditionsTableEditIndex: number | null;
  conditionsEditModePreviousRowData: ConditionsTableRowData;

  // Factor Table
  isFactorialFactorsTableEditMode: boolean;
  factorialFactorsTableEditIndex: number | null;
  factorialFactorsTableIndex: number | null;
  factorialFactorsEditModePreviousRowData: FactorialFactorTableRowData;

  // Level Table
  isFactorialLevelsTableEditMode: boolean;
  factorialLevelsTableEditIndex: number | null;
  factorialLevelsEditModePreviousRowData: FactorialLevelTableRowData;

  // Factorial Condition Table
  isFactorialConditionsTableEditMode: boolean;
  factorialConditionsTableEditIndex: number | null;
  factorialConditionsEditModePreviousRowData: FactorialConditionTableRowData;
}

export interface State extends AppState {
  experimentDesignStepper: ExperimentDesignStepperState;
}
