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

export interface ConditionsTableRowData {
  conditionCode: string;
  assignmentWeight: string;
  description: string;
  order: number;
}

export interface FactorialConditionTableRowData {
  levelNameOne: string;
  levelNameTwo: string;
  alias: string;
  weight: string;
  include: boolean;
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
  level: string;
  alias: string;
  order: number;
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
          level: 'Abstract',
          alias: '',
          order: 0,
        },
        {
          level: 'Concrete',
          alias: '',
          order: 1,
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
          level: 'No Support',
          alias: '',
          order: 0,
        },
        {
          level: 'Mindset',
          alias: 'Nice',
          order: 1,
        },
        {
          level: 'Utility Value',
          alias: 'Swell',
          order: 1,
        },
      ],
    },
  ],
};
