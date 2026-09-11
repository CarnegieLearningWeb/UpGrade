import { Action } from '@ngrx/store';
import { Observable, concat, defer, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  skipWhile,
  switchMap,
  takeUntil,
  throwIfEmpty,
  withLatestFrom,
} from 'rxjs/operators';
import { BatchDeleteResult, DeletionEligibilityResult, DeletionReasonCode } from 'upgrade_types';
import { RootBatchActions } from './batch-actions.actions';
import { RootBatchState, newBatchRequestId } from './batch-actions.models';
import { validateBatchResponse, validateEligibilityResponse } from './batch-actions.helpers';

export interface BatchDataSource {
  checkDeletionEligibility(ids: string[]): Observable<DeletionEligibilityResult>;
  batchDelete(ids: string[]): Observable<BatchDeleteResult>;
}

export function batchDeleteEffect(
  events: Observable<Action>,
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  data: BatchDataSource
) {
  return events.pipe(
    filter((action) => action.type === actions.batchDeleteRequested.type),
    withLatestFrom(state$),
    filter(
      ([action, state]) =>
        state.operation?.status === 'submitting' &&
        state.operation.snapshot.operationId ===
          (action as ReturnType<typeof actions.batchDeleteRequested>).snapshot.operationId
    ),
    exhaustMap(([, state]) => {
      const { snapshot } = state.operation;
      const ids = snapshot.items.map((item) => item.id);
      return defer(() => data.batchDelete(ids)).pipe(
        throwIfEmpty(),
        map((result) =>
          actions.batchDeleteCompleted({
            operationId: snapshot.operationId,
            result: validateBatchResponse(result, ids),
          })
        ),
        catchError((error) =>
          of(
            error?.status !== undefined
              ? actions.batchDeleteRequestFailed({ operationId: snapshot.operationId, status: error.status })
              : actions.batchDeleteCompleted({
                  operationId: snapshot.operationId,
                  // An invalid/empty successful response has no HTTP error for the interceptor to report.
                  result: {
                    phase: 'executed',
                    results: ids.map((id) => ({
                      id,
                      outcome: 'unknown',
                      reasonCode: DeletionReasonCode.OUTCOME_UNKNOWN,
                    })),
                  },
                })
          )
        ),
        // Logout/user replacement discards session state. Navigation alone never cancels this request.
        takeUntil(state$.pipe(filter((current) => current.userEmail !== state.userEmail || !current.operation)))
      );
    })
  );
}

export function reconcileBatchEffect(
  events: Observable<Action>,
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  data: BatchDataSource
) {
  return events.pipe(
    filter((action) => action.type === actions.batchDeleteCompleted.type),
    withLatestFrom(state$),
    filter(
      ([action, state]) =>
        state.operation?.status === 'reconciling' &&
        state.operation.snapshot.operationId === (action as ReturnType<typeof actions.batchDeleteCompleted>).operationId
    ),
    exhaustMap(([, state]) => {
      const operationId = state.operation.snapshot.operationId;
      const ids = state.operation.snapshot.items.map((item) => item.id);
      return defer(() => data.checkDeletionEligibility(ids)).pipe(
        throwIfEmpty(),
        map((result) =>
          actions.reconciliationCompleted({ operationId, result: validateEligibilityResponse(result, ids) })
        ),
        catchError(() => of(actions.reconciliationCompleted({ operationId, result: null }))),
        takeUntil(state$.pipe(filter((current) => current.userEmail !== state.userEmail || !current.operation)))
      );
    })
  );
}

export function batchFinishedEffect(
  events: Observable<Action>,
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  finish: (state: RootBatchState) => Action[]
) {
  return events.pipe(
    filter((action) =>
      [
        actions.batchDeleteCompleted.type,
        actions.batchDeleteRequestFailed.type,
        actions.reconciliationCompleted.type,
      ].some((type) => type === action.type)
    ),
    withLatestFrom(state$),
    filter(
      ([action, state]) =>
        state.operation?.status === 'complete' &&
        state.operation.snapshot.operationId === (action as ReturnType<typeof actions.batchDeleteCompleted>).operationId
    ),
    distinctUntilChanged(
      (previous, current) => previous[1].operation.snapshot.operationId === current[1].operation.snapshot.operationId
    ),
    // HTTP failures already use the same error notification as single deletion. Do not refresh or notify twice.
    switchMap(([, state]) => (state.operation.transportStatus !== undefined ? [] : finish(state)))
  );
}

/** Read current state at subscription time, after the list-start action reaches the reducer. */
export function trackedListRequest<T>(
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  dispatch: (action: Action) => void,
  request: () => Observable<T>,
  success: (data: T, requestId: string) => Action[],
  failure: () => Action[]
) {
  return defer(() => {
    const requestId = newBatchRequestId();
    dispatch(actions.listRequested({ requestId }));
    return request().pipe(
      switchMap((data) => success(data, requestId)),
      catchError(() => concat(of(actions.listFailed({ requestId })), of(...failure()))),
      // NgRx queues a nested dispatch until the current action finishes. Observe our start before
      // treating a different token (including null on deletion/logout) as cancellation.
      takeUntil(
        state$.pipe(
          skipWhile((state) => state.listRequestId !== requestId),
          filter((state) => state.listRequestId !== requestId)
        )
      )
    );
  });
}
