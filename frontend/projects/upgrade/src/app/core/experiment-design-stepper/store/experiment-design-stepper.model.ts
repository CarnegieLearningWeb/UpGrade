import { AppState } from '../../core.module';

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
export interface ExperimentAliasTableRow {
  id?: string;
  site: string;
  target: string;
  condition: string;
  alias: string;
  isEditing: boolean;
  rowStyle?: 'odd' | 'even';
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
  alias: string;
  weight: string;
  include: boolean;
}

export interface FactorialLevelTableRowData {
  id: string;
  name: string;
}

export interface ExperimentFactorialDesignData {
  factors: ExperimentFactorFormData[];
}

export interface ExperimentFactorFormData {
  factor: string;
  site: string;
  target: string;
  order: number;
  levels: ExperimentLevelFormData[];
}

export interface ExperimentLevelFormData {
  id: string;
  level: string;
  alias: string;
}

export interface ExperimentDesignStepperState {
  isAliasTableEditMode: boolean;
  aliasTableEditIndex: number | null;
  isConditionsTableEditMode: boolean;
  conditionsTableEditIndex: number | null;
  conditionsEditModePreviousRowData: ConditionsTableRowData;
  isFactorialConditionsTableEditMode: boolean;
  factorialConditionsTableEditIndex: number | null;
  factorialConditionsEditModePreviousRowData: FactorialConditionTableRowData;
  factorialDesignData: ExperimentFactorialDesignData;
  factorialConditionsTableData: FactorialConditionTableRowData[];
  hasExperimentStepperDataChanged: boolean;
}

export interface State extends AppState {
  experimentDesignStepper: ExperimentDesignStepperState;
}

export const DUMMY_CONDITION_TABLE_DATA = {
  factors: [
    {
      factor: 'Question Type',
      site: 'SelectSection',
      target: 'aaa',
      order: 0,
      levels: [
        {
          id: '111',
          level: 'Abstract',
          alias: '',
        },
        {
          id: '222',
          level: 'Concrete',
          alias: '',
        },
      ],
    },
    {
      factor: 'Motivation',
      site: 'SelectSection',
      target: 'aaa',
      order: 0,
      levels: [
        {
          id: '333',
          level: 'No Support',
          alias: '',
        },
        {
          id: '444',
          level: 'Mindset',
          alias: 'Nice',
        },
        {
          id: '555',
          level: 'Utility Value',
          alias: 'Swell',
        },
      ],
    },
  ],
};
