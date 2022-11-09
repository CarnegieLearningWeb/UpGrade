import { createAction, createReducer } from '@ngrx/store';
import { AppState } from '../core.module';
import { initStateFromLocalStorage } from './init-state-from-local-storage.reducer';

describe('initStateFromLocalStorage', () => {
  it('should just return state if INIT or UPDATE is not the action called', () => {
    const previousState: AppState = {
      router: null,
    };
    const reducer = createReducer(previousState);

    const metaReducer = initStateFromLocalStorage(reducer);
    const newState = metaReducer(previousState, createAction('[Logs] Get Audit Logs Success'));

    expect(newState).toEqual(previousState);
  });
});
