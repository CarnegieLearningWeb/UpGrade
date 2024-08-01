import { createReducer, on } from '@ngrx/store';
import * as ErrorActions from './error-event-bus.actions';
import { SERVER_ERROR } from 'upgrade_types';

export interface ErrorState {
  exampleError: {
    type: SERVER_ERROR.EXAMPLE_ERROR;
    [key: string]: any;
  } | null;
}

export const initialState: ErrorState = {
  exampleError: null,
};

const reducer = createReducer(
  initialState,
  on(ErrorActions.actionSetExampleError, (state, { errorEvent }) => {
    return { ...state, exampleError: errorEvent };
  }),
  on(ErrorActions.actionClearExampleError, (state) => {
    return { ...state, exampleError: null };
  })
);

export function errorReducer(state: ErrorState, action) {
  return reducer(state, action);
}
