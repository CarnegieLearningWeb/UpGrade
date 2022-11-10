import { createAction } from '@ngrx/store';

export const formDataChanged = createAction('[data-change-flag Component] turn dataChanged true');
export const formDataReset = createAction('[data-change-flag Component] turn dataChanged false');