import { StratificationFactorsState, StratificationFactor } from './stratification-factors.model';
import { Action, createReducer, on } from '@ngrx/store';
import { EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import * as StratificationFactorsActions from '../store/stratification-factors.actions';

export const adapter: EntityAdapter<StratificationFactor> = createEntityAdapter<StratificationFactor>({
  selectId: (factor) => factor.factor,
});

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const initialState: StratificationFactorsState = adapter.getInitialState({
  isLoadingStratificationFactors: false,
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
  on(StratificationFactorsActions.actionDeleteStratificationFactorSuccess, (state, { stratificationFactor }) =>
    adapter.removeOne(stratificationFactor.factor, state)
  ),
  on(
    StratificationFactorsActions.actionFetchStratificationFactorsFailure,
    StratificationFactorsActions.actionDeleteStratificationFactorFailure,
    (state) => ({ ...state, isLoading: false })
  ),
  on(
    StratificationFactorsActions.actionSetIsLoadingStratificationFactors,
    (state, { isLoadingStratificationFactors }) => ({ ...state, isLoadingStratificationFactors })
  )
);

export function stratificationFactorsReducer(state: StratificationFactorsState | undefined, action: Action) {
  return reducer(state, action);
}
