import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LogsDataService } from '../logs.data.service';
import * as logsActions from './logs.actions';
import { mergeMap, map, catchError, withLatestFrom, filter, tap } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
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
import { NUMBER_OF_LOGS, AuditLogParams, AuditLogsMetadata, ErrorLogParams } from './logs.model';

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
          map((data: any) =>
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
          map((data: any) =>
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

  getExperimentLogs$ = this.createScopedAuditLogsEffect({
    actionType: logsActions.actionGetExperimentLogs,
    stateSelector: selectExperimentLogsState,
    getId: (action) => action.experimentId,
    idParam: (experimentId) => ({ experimentId }),
    successAction: (experimentId, auditLogs, total, fromStart) =>
      logsActions.actionGetExperimentLogsSuccess({ experimentId, auditLogs, totalAuditLogs: total, fromStart }),
    failureAction: (experimentId) => logsActions.actionGetExperimentLogsFailure({ experimentId }),
  });

  changeExperimentLogFilter$ = this.createFilterChangeEffect(
    logsActions.actionSetExperimentLogFilter,
    ({ experimentId }) => this.store$.dispatch(logsActions.actionGetExperimentLogs({ experimentId, fromStart: true }))
  );

  getFeatureFlagLogs$ = this.createScopedAuditLogsEffect({
    actionType: logsActions.actionGetFeatureFlagLogs,
    stateSelector: selectFeatureFlagLogsState,
    getId: (action) => action.flagId,
    idParam: (flagId) => ({ flagId }),
    successAction: (flagId, auditLogs, total, fromStart) =>
      logsActions.actionGetFeatureFlagLogsSuccess({ flagId, auditLogs, totalAuditLogs: total, fromStart }),
    failureAction: (flagId) => logsActions.actionGetFeatureFlagLogsFailure({ flagId }),
  });

  changeFeatureFlagLogFilter$ = this.createFilterChangeEffect(logsActions.actionSetFeatureFlagLogFilter, ({ flagId }) =>
    this.store$.dispatch(logsActions.actionGetFeatureFlagLogs({ flagId, fromStart: true }))
  );

  private createScopedAuditLogsEffect(config: {
    actionType: any;
    stateSelector: any;
    getId: (action: any) => string;
    idParam: (id: string) => Partial<AuditLogParams>;
    successAction: (id: string, auditLogs: any[], total: number, fromStart: boolean) => any;
    failureAction: (id: string) => any;
  }) {
    return createEffect(() =>
      this.actions$.pipe(
        ofType(config.actionType),
        withLatestFrom(this.store$.pipe(select(config.stateSelector))),
        map(([action, logsState]: [any, Record<string, AuditLogsMetadata>]) => ({
          id: config.getId(action),
          fromStart: action.fromStart || false,
          metadata: logsState[config.getId(action)],
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
            map((data: any) => config.successAction(id, data.nodes, data.total, fromStart)),
            catchError(() => [config.failureAction(id)])
          );
        })
      )
    );
  }

  private createFilterChangeEffect(actionType: any, dispatchFn: (action: any) => void) {
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
