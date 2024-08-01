import { createAction, props } from '@ngrx/store';
import { SERVER_ERROR } from 'upgrade_types';

export const actionSetExampleError = createAction('[Error] Set ExampleError', props<{ errorEvent: any }>());

export const actionClearExampleError = createAction('[Error] Clear ExampleError');

export const errorTypeToActionsMap = {
  [SERVER_ERROR.EXAMPLE_ERROR]: {
    set: actionSetExampleError,
    clear: actionClearExampleError,
  },
};
