import { AppState } from '../../core.module';
import { OPERATION_TYPES } from 'upgrade_types';

export {
  OPERATION_TYPES
};

export interface AnalysisState {
  isAnalysisLoading: boolean;
  data: any
}

export interface State extends AppState {
  analysis: AnalysisState;
}
