import { AppState } from '../../core.module';
import { OPERATION_TYPES } from 'upgrade_types';

export {
  OPERATION_TYPES
};

export interface TreeData {
  id: number;
  key: string;
  children: TreeData[];
}

export interface IQueryBuilder {
  experimentId: string;
  metric: string[];
  operationType: OPERATION_TYPES;
  timeRange?: {
    from: string,
    to: string ,
  }
}

export interface AnalysisState {
  isAnalysisLoading: boolean;
  data: any
}

export interface State extends AppState {
  analysis: AnalysisState;
}
