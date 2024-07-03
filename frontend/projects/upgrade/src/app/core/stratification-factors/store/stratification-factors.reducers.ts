import { StratificationFactorsState, StratificationFactor } from './stratification-factors.model';
import { Action, createReducer, on } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as StratificationFactorsActions from '../store/stratification-factors.actions';

export const adapter: EntityAdapter<StratificationFactor> = createEntityAdapter<StratificationFactor>({
  selectId: (factor) => factor.factor,
});

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: StratificationFactorsState = adapter.getInitialState({
  isLoading: false,
  totalStratificationFactors: null,
  isFactorAddRequestSuccess: false,
});

const reducer = createReducer(
  initialState,
  on(StratificationFactorsActions.actionFetchStratificationFactors, (state) => ({ ...state, isLoading: true })),
  on(
    StratificationFactorsActions.actionFetchStratificationFactorsSuccess,
    (state, { stratificationFactors, isFactorAddRequestSuccess }) => {
      const newState = {
        ...state,
        stratificationFactors,
        isFactorAddRequestSuccess,
      };
      return adapter.upsertMany(stratificationFactors, { ...newState, isLoading: false });
    }
  ),
  on(StratificationFactorsActions.actionDeleteStratificationFactorSuccess, (state, { stratificationFactor }) =>
    adapter.removeOne(stratificationFactor.factor, state)
  ),
  on(
    StratificationFactorsActions.actionFetchStratificationFactorsFailure,
    StratificationFactorsActions.actionDeleteStratificationFactorFailure,
    (state) => ({ ...state, isLoading: false })
  ),
  on(StratificationFactorsActions.actionSetIsLoadingStratificationFactors, (state, { isLoading }) => ({
    ...state,
    isLoading,
  })),
  on(StratificationFactorsActions.actionImportStratificationFactorSuccess, (state, { isFactorAddRequestSuccess }) => ({
    ...state,
    isFactorAddRequestSuccess,
  }))
);

export function stratificationFactorsReducer(state: StratificationFactorsState | undefined, action: Action) {
  return reducer(state, action);
}
