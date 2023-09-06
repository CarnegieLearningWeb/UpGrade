import { AppState } from '../../core.state';
import { EntityState } from '@ngrx/entity';

export interface State extends AppState {
  StratificationFactors: StratificationFactorsState;
}

export interface StratificationFactors {
  id: string;
  factor: string;
  value: Record<string, number>;
  nonApplicable: number;
}

export interface StratificationFactorsState extends EntityState<StratificationFactors> {
  isLoading: boolean;
  totalStratificationFactors: any;
}
