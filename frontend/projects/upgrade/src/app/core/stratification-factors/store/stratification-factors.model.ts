import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface State extends AppState {
  stratificationFactors: StratificationFactorsState;
}

export interface StratificationFactor {
  factor: string;
  factorValue: Record<string, number>;
}

export interface StratificationFactorSimple {
  factorName: string;
}

export interface StratificationFactorsState extends EntityState<StratificationFactor> {
  isLoadingStratificationFactors: boolean;
  totalStratificationFactors: number;
}

export interface CsvDataItem {
  file: string;
}
