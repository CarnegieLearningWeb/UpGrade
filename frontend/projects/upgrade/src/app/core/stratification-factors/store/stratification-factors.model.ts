import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface State extends AppState {
  stratificationFactors: StratificationFactorsState;
}

export interface StratificationFactor {
  factorId: string;
  factor: string;
  values: Record<string, number>;
  notApplicable: number;
}

export interface StratificationFactorsState extends EntityState<StratificationFactor> {
  isLoading: boolean;
  totalStratificationFactors: any;
}
