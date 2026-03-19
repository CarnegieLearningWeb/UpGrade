import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError, withLatestFrom, filter, tap } from 'rxjs/operators';
import { Store, select, Action, ActionCreator, Creator, MemoizedSelector } from '@ngrx/store';
import { AppState } from '../../core.state';
import {
  selectTotalAuditLogs,
  selectTotalErrorLogs,
  selectIsErrorLogLoading,
  selectSkipAuditLog,
  selectSkipErrorLog,
  selectAuditFilterType,
  selectErrorFilterType,
  selectExperimentLogsState,
  selectFeatureFlagLogsState,
} from './logs.selectors';
import { NUMBER_OF_LOGS, AuditLogParams, AuditLogs, AuditLogsMetadata, ErrorLogParams } from './logs.model';

/**
 * Configuration for LogsEffects.createEntityTypeAuditLogsEffect.
 *
 * `EntityTypeAction` refers to either an Experiment or Flag action
 */
interface EntityTypeAuditLogsEffectConfig<EntityTypeAction extends Action & { fromStart?: boolean }> {
  /** The action creator that triggers the log fetch (e.g. `actionGetExperimentLogs`). */
  action: ActionCreator<string, Creator<Record<string, unknown>[], EntityTypeAction>>;
  /**
   * Selector that returns the entity-keyed metadata map from the store.
   * Each entry tracks the current page offset, total count, loading state, and active filter
   * for one entity instance (e.g. one experiment or one feature flag).
   */
  entityLogStateSelector: MemoizedSelector<AppState, Record<string, AuditLogsMetadata>>;
  /** Extracts the entity ID string from the dispatched action (e.g. `action.experimentId`). */
  getEntityIdFromAction: (action: EntityTypeAction) => string;
  /**
   * Returns the entity-specific field(s) to merge into the API request params.
   * For experiments this is `{ experimentId }`, for feature flags `{ flagId }`, etc.
   */
  idParam: (id: string) => Partial<AuditLogParams>;
  /** Builds the success action from the API response data. */
  successAction: (id: string, auditLogs: AuditLogs[], total: number, fromStart: boolean) => Action;
  /** Builds the failure action when the API request errors. */
  failureAction: (id: string) => Action;
}

@Injectable()
export class LogsEffects {
  constructor(private actions$: Actions, private logsDataService: LogsDataService, private store$: Store<AppState>) {}

  getAllAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetAuditLogs),
      map((action) => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectSkipAuditLog)),
        this.store$.pipe(select(selectAuditFilterType)),
        this.store$.pipe(select(selectTotalAuditLogs))
      ),
      filter(
        ([fromStart, skipAuditLog, , totalAuditLogs]) =>
          skipAuditLog < totalAuditLogs || totalAuditLogs === null || fromStart
      ),
      tap(([fromStart]) => {
        this.store$.dispatch(logsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
        if (fromStart) {
          this.store$.dispatch(logsActions.actionSetSkipAuditLog({ skipAuditLog: 0 }));
        }
      }),
      mergeMap(([fromStart, skipAuditLog, filterType]) => {
        let params: AuditLogParams = { skip: fromStart ? 0 : skipAuditLog, take: NUMBER_OF_LOGS };
        if (filterType) {
          params = { ...params, filter: filterType };
        }
        return this.logsDataService.getAllAuditLogs(params).pipe(
          map((data) =>
            logsActions.actionGetAuditLogsSuccess({
              auditLogs: data.nodes,
              totalAuditLogs: data.total,
            })
          ),
          catchError(() => [logsActions.actionGetAuditLogsFailure()])
        );
      })
    )
  );

  getAllErrorLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logsActions.actionGetErrorLogs),
      map((action) => action.fromStart),
      withLatestFrom(
        this.store$.pipe(select(selectSkipErrorLog)),
        this.store$.pipe(select(selectErrorFilterType)),
        this.store$.pipe(select(selectIsErrorLogLoading)),
        this.store$.pipe(select(selectTotalErrorLogs))
      ),
      filter(
        ([fromStart, skipErrorLog, __, isErrorLogLoading, totalErrorLogs]) =>
          !isErrorLogLoading && (skipErrorLog < totalErrorLogs || totalErrorLogs === null || fromStart)
      ),
      tap(([fromStart]) => {
        this.store$.dispatch(logsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
        if (fromStart) {
          this.store$.dispatch(logsActions.actionSetSkipErrorLog({ skipErrorLog: 0 }));
        }
      }),
      mergeMap(([fromStart, skipErrorLog, filterType]) => {
        let params: ErrorLogParams = { skip: fromStart ? 0 : skipErrorLog, take: NUMBER_OF_LOGS };
        if (filterType) {
          params = { ...params, filter: filterType };
        }
        return this.logsDataService.getAllErrorLogs(params).pipe(
          map((data) =>
            logsActions.actionGetErrorLogsSuccess({
              errorLogs: data.nodes,
              totalErrorLogs: data.total,
            })
          ),
          catchError(() => [logsActions.actionGetErrorLogsFailure()])
        );
      })
    )
  );

  changeAuditFilter$ = this.createFilterChangeEffect(logsActions.actionSetAuditLogFilter, () =>
    this.store$.dispatch(logsActions.actionGetAuditLogs({ fromStart: true }))
  );

  changeErrorFilter$ = this.createFilterChangeEffect(logsActions.actionSetErrorLogFilter, () =>
    this.store$.dispatch(logsActions.actionGetErrorLogs({ fromStart: true }))
  );

  getExperimentLogs$ = this.createEntityTypeAuditLogsEffect({
    action: logsActions.actionGetExperimentLogs,
    entityLogStateSelector: selectExperimentLogsState,
    getEntityIdFromAction: (action) => action.experimentId,
    idParam: (experimentId) => ({ experimentId }),
    successAction: (experimentId, auditLogs, total, fromStart) =>
      logsActions.actionGetExperimentLogsSuccess({ experimentId, auditLogs, totalAuditLogs: total, fromStart }),
    failureAction: (experimentId) => logsActions.actionGetExperimentLogsFailure({ experimentId }),
  });

  changeExperimentLogFilter$ = this.createFilterChangeEffect(
    logsActions.actionSetExperimentLogFilter,
    ({ experimentId }) => this.store$.dispatch(logsActions.actionGetExperimentLogs({ experimentId, fromStart: true }))
  );

  getFeatureFlagLogs$ = this.createEntityTypeAuditLogsEffect({
    action: logsActions.actionGetFeatureFlagLogs,
    entityLogStateSelector: selectFeatureFlagLogsState,
    getEntityIdFromAction: (action) => action.flagId,
    idParam: (flagId) => ({ flagId }),
    successAction: (flagId, auditLogs, total, fromStart) =>
      logsActions.actionGetFeatureFlagLogsSuccess({ flagId, auditLogs, totalAuditLogs: total, fromStart }),
    failureAction: (flagId) => logsActions.actionGetFeatureFlagLogsFailure({ flagId }),
  });

  changeFeatureFlagLogFilter$ = this.createFilterChangeEffect(logsActions.actionSetFeatureFlagLogFilter, ({ flagId }) =>
    this.store$.dispatch(logsActions.actionGetFeatureFlagLogs({ flagId, fromStart: true }))
  );

  /**
   * Builds a paginated audit-log effect EntityType to a specific entity (e.g. experiment, feature flag).
   *
   * Pagination state is stored per entity ID in the NgRx store. The effect:
   *   1. Reads existing pagination metadata for the entity from the store.
   *   2. Skips the request if all pages have already been loaded (unless `fromStart` is true).
   *   3. Fetches the next page (or resets to page 0 when `fromStart` is true).
   *   4. Dispatches the provided success or failure action with the result.
   *
   * @param config - {@link EntityTypeAuditLogsEffectConfig}
   */
  private createEntityTypeAuditLogsEffect<EntityTypeAction extends Action & { fromStart?: boolean }>(
    config: EntityTypeAuditLogsEffectConfig<EntityTypeAction>
  ) {
    return createEffect(() =>
      this.actions$.pipe(
        ofType(config.action),
        withLatestFrom(this.store$.pipe(select(config.entityLogStateSelector))),
        map(([action, logsState]) => ({
          id: config.getEntityIdFromAction(action),
          fromStart: action.fromStart || false,
          metadata: logsState[config.getEntityIdFromAction(action)],
        })),
        filter(({ metadata, fromStart }) => {
          if (fromStart) return true;
          if (!metadata || metadata.total === null) return true;
          return metadata.skip < metadata.total;
        }),
        mergeMap(({ id, fromStart, metadata }) => {
          const skip = fromStart ? 0 : metadata?.skip || 0;
          const logFilter = metadata?.filter || null;

          let params: AuditLogParams = { skip, take: NUMBER_OF_LOGS, ...config.idParam(id) };
          if (logFilter) {
            params = { ...params, filter: logFilter };
          }

          return this.logsDataService.getAllAuditLogs(params).pipe(
            map((data) => config.successAction(id, data.nodes, data.total, fromStart)),
            catchError(() => [config.failureAction(id)])
          );
        })
      )
    );
  }

  /**
   * Builds a side-effect-only effect that reacts to a filter-change action and re-triggers
   * the corresponding log fetch from the beginning of the list.
   *
   * The effect does not dispatch any action itself (`dispatch: false`); instead it calls
   * `dispatchFn`, which the caller supplies to dispatch the appropriate fetch action with
   * `fromStart: true`.
   *
   * @param actionType - The filter-change action creator to listen for.
   * @param dispatchFn - Called with the dispatched action; responsible for triggering the reload.
   * @typeParam EntityTypeAction - The NgRx filter-change action type being handled.
   */
  private createFilterChangeEffect<EntityTypeAction extends Action>(
    actionType: ActionCreator<string, Creator<Record<string, unknown>[], EntityTypeAction>>,
    dispatchFn: (action: EntityTypeAction) => void
  ) {
    return createEffect(
      () =>
        this.actions$.pipe(
          ofType(actionType),
          tap((action) => dispatchFn(action))
        ),
      { dispatch: false }
    );
  }
}
