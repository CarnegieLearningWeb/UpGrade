import { Action } from '@ngrx/store';
import * as AuthActions from '../auth/store/auth.actions';

export function clearState(reducer) {
  return (state, action: Action) => {
    if (action.type === AuthActions.actionLogoutSuccess.type) {
      state = undefined;
    }
    return reducer(state, action);
  };
}
