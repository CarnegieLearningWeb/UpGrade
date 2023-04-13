import { PAYLOAD_TYPE } from '../../../../../../../../types/src';
import { AppState } from '../../core.module';
import {
  ExperimentCondition,
  ExperimentDecisionPoint,
  LevelCombinationElement,
} from '../../experiments/store/experiments.model';

// in PUT/POST request, parentCondition and decisionPoint are id string
export interface ExperimentConditionPayloadRequestObject {
  id?: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
  // payload: string;
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
export interface SimpleExperimentPayloadTableRow {
  id?: string;
  designTableCombinationId?: string;
  site: string;
  target: string;
  condition: string;
  payload: string;
  // payload: {
  //   type: PAYLOAD_TYPE;
  //   value: string;
  // };
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
  conditionPayloadId?: string;
  levels: FactorialLevelTableRowData[];
  condition: string;
  // payload: {
  //   type: PAYLOAD_TYPE;
  //   value: string;
  // };
  payload: string;
  weight: string;
  include: boolean;
}

export interface FactorialConditionTableDataFromConditionPayload {
  id: string;
  conditionCode: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
  assignmentWeight: string;
}

export interface FactorialFactorTableRowData {
  id: string;
  name: string;
  description: string;
}
export interface FactorialLevelTableRowData {
  id: string;
  name: string;
  // payload: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
}

//Design data with payload as object
export interface ExperimentFactorialDesignData {
  factors: ExperimentFactorData[];
}

export interface ExperimentFactorData {
  name: string;
  description: string;
  order: number;
  levels: ExperimentLevelData[];
}

export interface ExperimentLevelData {
  id: string;
  name: string;
  payload: {
    type: PAYLOAD_TYPE;
    value: string;
  };
}

//Form data with payload as string
export interface ExperimentFactorialFormDesignData {
  factors: ExperimentFactorFormData[];
}

export interface ExperimentFactorFormData {
  name: string;
  description: string;
  order: number;
  levels: ExperimentLevelFormData[];
}

export interface ExperimentLevelFormData {
  id: string;
  name: string;
  payload: string;
}

export interface ExperimentDesignStepperState {
  hasExperimentStepperDataChanged: boolean;

  simpleExperimentDesignData: SimpleExperimentDesignData;
  factorialExperimentDesignData: ExperimentFactorialDesignData;
  simpleExperimentPayloadTableData: SimpleExperimentPayloadTableRow[];
  factorialConditionsTableData: FactorialConditionTableRowData[];
  factorialLevelsTableData: FactorialLevelTableRowData[];
  factorialFactorsTableData: FactorialFactorTableRowData[];

  // Payload Table
  isSimpleExperimentPayloadTableEditMode: boolean;
  simpleExperimentPayloadTableEditIndex: number | null;

  // Decision Point Table
  isDecisionPointsTableEditMode: boolean;
  isLevelsTableEditMode?: boolean;
  decisionPointsTableEditIndex: number | null;
  levelsTableEditIndex?: number | null;
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
