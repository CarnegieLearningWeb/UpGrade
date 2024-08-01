import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ErrorState } from './error-event-bus.reducer';
import { ERROR_EVENT_BUS_FEATURE_STORE_KEY } from '../error-event-bus.module';

export const selectErrorState = createFeatureSelector<ErrorState>(ERROR_EVENT_BUS_FEATURE_STORE_KEY);

export const selectExampleError = createSelector(selectErrorState, (state: ErrorState) => state.exampleError);
