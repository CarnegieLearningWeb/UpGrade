import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface State extends AppState {
  stratificationFactors: StratificationFactorsState;
}

export interface StratificationFactor {
  factor: string;
  factorValue: Record<string, number>;
  experimentIds: string[];
}

export interface StratificationFactorDeleteResponse {
  stratificationFactorName: string;
  factorValue: Record<string, number>;
  experimentIds: string[];
}

export interface StratificationFactorSimple {
  factorName: string;
}

export interface StratificationFactorsState extends EntityState<StratificationFactor> {
  isLoading: boolean;
  totalStratificationFactors: number;
  isFactorAddRequestSuccess: boolean;
}

export interface CsvDataItem {
  file: string;
}
