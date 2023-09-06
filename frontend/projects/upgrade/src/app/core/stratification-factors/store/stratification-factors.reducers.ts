import { StratificationFactorsState, StratificationFactors } from './stratification-factors.model';
import { Action, createReducer, on } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as StratificationFactorsActions from '../store/stratification-factors.actions';

export const adapter: EntityAdapter<StratificationFactors> = createEntityAdapter<StratificationFactors>();

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: StratificationFactorsState = adapter.getInitialState({
  isLoading: false,
  totalStratificationFactors: null,
});

const reducer = createReducer(
  initialState,
  on(StratificationFactorsActions.actionFetchStratificationFactors, (state) => ({ ...state, isLoading: true })),
  on(StratificationFactorsActions.actionFetchStratificationFactorsSuccess, (state, { stratificationFactors }) => {
    const newState = {
      ...state,
      stratificationFactors,
    };
    return adapter.upsertMany(stratificationFactors, { ...newState, isLoading: false });
  }),
  on(StratificationFactorsActions.actionFetchStratificationFactorsFailure, (state) => ({ ...state, isLoading: false }))
);

export function stratificationFactorsReducer(state: StratificationFactorsState | undefined, action: Action) {
  return reducer(state, action);
}
