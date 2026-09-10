import { Action } from '@ngrx/store';
import { EMPTY, Observable, concat, defer, fromEvent, merge, of } from 'rxjs';
import {
  auditTime,
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
import { BatchDeleteResult, DeletionEligibilityResult } from 'upgrade_types';
import { RootBatchActions } from './batch-actions.actions';
import { RootBatchState, isBatchBusy, newBatchRequestId } from './batch-actions.models';
import { validateBatchResponse, validateEligibilityResponse } from './batch-actions.helpers';

export interface BatchDataSource {
  checkDeletionEligibility(ids: string[]): Observable<DeletionEligibilityResult>;
  batchDelete(ids: string[]): Observable<BatchDeleteResult>;
}

export function eligibilityEffect(
  events: Observable<Action>,
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  data: BatchDataSource
) {
  return events.pipe(
    filter((action) => action.type === actions.refreshEligibility.type),
    withLatestFrom(state$),
    filter(
      ([action, state]) =>
        (action as ReturnType<typeof actions.refreshEligibility>).requestId === state.eligibility.requestId
    ),
    switchMap(([, state]) => {
      const { requestId, revision } = state.eligibility;
      const ids = Object.keys(state.selectedById);
      return defer(() => data.checkDeletionEligibility(ids)).pipe(
        throwIfEmpty(),
        map((result) =>
          actions.eligibilitySucceeded({ requestId, revision, result: validateEligibilityResponse(result, ids) })
        ),
        catchError(() => of(actions.eligibilityFailed({ requestId, revision }))),
        takeUntil(state$.pipe(filter((current) => current.eligibility.requestId !== requestId)))
      );
    })
  );
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
          of(actions.batchDeleteRequestFailed({ operationId: snapshot.operationId, status: error?.status || 0 }))
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
    filter((action) =>
      [actions.batchDeleteCompleted.type, actions.batchDeleteRequestFailed.type].some((type) => type === action.type)
    ),
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
    switchMap(([, state]) => finish(state))
  );
}

/** Invalidation changes the revision before the read is dispatched. Coalescing is enforced in the reducer. */
export function refreshSelectedEffect(
  events: Observable<Action>,
  actions: RootBatchActions,
  invalidatingTypes: string[]
) {
  return events.pipe(
    filter((action) => invalidatingTypes.includes(action.type)),
    switchMap(() => [
      actions.invalidateEligibility(),
      actions.refreshEligibility({ requestId: newBatchRequestId(), forConfirmation: false }),
    ])
  );
}

export function selectionFocusEffect(state$: Observable<RootBatchState>, actions: RootBatchActions) {
  return defer(() =>
    typeof window === 'undefined'
      ? EMPTY
      : merge(
          fromEvent(window, 'focus'),
          fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'))
        )
  ).pipe(
    auditTime(100),
    withLatestFrom(state$),
    filter(([, state]) => !!Object.keys(state.selectedById).length && !isBatchBusy(state)),
    map(() => actions.refreshEligibility({ requestId: newBatchRequestId(), forConfirmation: false }))
  );
}

export function eligibilityAbsenceEffect(
  events: Observable<Action>,
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  finish: (count: number) => Action[]
) {
  return events.pipe(
    filter((action) => action.type === actions.eligibilitySucceeded.type),
    withLatestFrom(state$),
    filter(
      ([action, state]) =>
        (action as ReturnType<typeof actions.eligibilitySucceeded>).requestId === state.eligibility.requestId &&
        !!state.eligibility.absentIds?.length
    ),
    switchMap(([, state]) => finish(state.eligibility.absentIds.length))
  );
}

/** Read current state at subscription time, after the list-start action reaches the reducer. */
export function trackedListRequest<T>(
  state$: Observable<RootBatchState>,
  actions: RootBatchActions,
  dispatch: (action: Action) => void,
  fromStarting: boolean,
  batchRefresh: boolean,
  request: () => Observable<T>,
  success: (data: T, requestId: string) => Action[],
  failure: () => Action[]
) {
  return defer(() => {
    const requestId = newBatchRequestId();
    dispatch(actions.listRequested({ requestId, fromStarting }));
    return request().pipe(
      switchMap((data) => success(data, requestId)),
      catchError(() => concat(of(actions.listFailed({ requestId, batchRefresh })), of(...failure()))),
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
