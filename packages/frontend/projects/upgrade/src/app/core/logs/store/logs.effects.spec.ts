import { ActionsSubject } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { LogsEffects } from './logs.effects';
import * as LogsActions from './logs.actions';
import * as LogsSelectors from './logs.selectors';
import { LOG_TYPE, SERVER_ERROR } from 'upgrade_types';
import { fakeAsync, tick } from '@angular/core/testing';

describe('LogsEffects', () => {
  let service: LogsEffects;
  let actions$: ActionsSubject;
  let store$: any;
  let logsDataService: any;

  beforeEach(() => {
    actions$ = new ActionsSubject();
    store$ = new BehaviorSubject({});
    store$.dispatch = jest.fn();
    logsDataService = {};

    LogsSelectors.selectSkipAuditLog.setResult(0);
    LogsSelectors.selectAuditFilterType.setResult(LOG_TYPE.EXPERIMENT_CREATED);
    LogsSelectors.selectIsAuditLogLoading.setResult(false);
    LogsSelectors.selectTotalAuditLogs.setResult(10);
    LogsSelectors.selectSkipErrorLog.setResult(0);
    LogsSelectors.selectErrorFilterType.setResult(SERVER_ERROR.ASSIGNMENT_ERROR);
    LogsSelectors.selectIsErrorLogLoading.setResult(false);
    LogsSelectors.selectTotalErrorLogs.setResult(10);

    logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(of({}));
    logsDataService.getAllErrorLogs = jest.fn().mockReturnValue(of({}));

    service = new LogsEffects(actions$, logsDataService, store$);
  });

  describe('getAllAuditLogs$', () => {
    it('should do nothing if skipAuditLog > totalAuditLogs, and fromStarting is false', fakeAsync(() => {
      let neverEmitted = true;
      LogsSelectors.selectIsAuditLogLoading.setResult(false);
      LogsSelectors.selectSkipAuditLog.setResult(11);
      LogsSelectors.selectTotalAuditLogs.setResult(10);

      service.getAllAuditLogs$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(LogsActions.actionGetAuditLogs({}));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should always dispatch actionSetIsAuditLogLoading if not filtered out', fakeAsync(() => {
      LogsSelectors.selectIsAuditLogLoading.setResult(false);
      LogsSelectors.selectSkipAuditLog.setResult(1);
      LogsSelectors.selectTotalAuditLogs.setResult(10);
      LogsSelectors.selectAuditFilterType.setResult(LOG_TYPE.EXPERIMENT_CREATED);

      service.getAllAuditLogs$.subscribe();

      actions$.next(LogsActions.actionGetAuditLogs({}));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
      expect(store$.dispatch).not.toHaveBeenCalledWith(LogsActions.actionSetSkipAuditLog({ skipAuditLog: 0 }));
    }));

    it('should dispatch actionSetSkipAuditLog if not filtered out and fromStarting is true', fakeAsync(() => {
      LogsSelectors.selectIsAuditLogLoading.setResult(false);
      LogsSelectors.selectSkipAuditLog.setResult(1);
      LogsSelectors.selectTotalAuditLogs.setResult(10);
      LogsSelectors.selectAuditFilterType.setResult(LOG_TYPE.EXPERIMENT_CREATED);

      service.getAllAuditLogs$.subscribe();

      actions$.next(LogsActions.actionGetAuditLogs({ fromStart: true }));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetIsAuditLogLoading({ isAuditLogLoading: true }));
      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetSkipAuditLog({ skipAuditLog: 0 }));
    }));

    it('should dispatch actionGetAuditLogsSuccess if valid request is successful from service', fakeAsync(() => {
      LogsSelectors.selectIsAuditLogLoading.setResult(false);
      LogsSelectors.selectSkipAuditLog.setResult(1);
      LogsSelectors.selectTotalAuditLogs.setResult(10);
      LogsSelectors.selectAuditFilterType.setResult(LOG_TYPE.EXPERIMENT_CREATED);

      const mockReturnData = {
        nodes: [],
        total: 0,
      };

      logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(of(mockReturnData));

      const expectedAction = LogsActions.actionGetAuditLogsSuccess({
        auditLogs: [],
        totalAuditLogs: 0,
      });

      service.getAllAuditLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetAuditLogs({ fromStart: true }));

      tick(0);
    }));

    it('should dispatch actionGetAuditLogsFailure if valid request errors from service', fakeAsync(() => {
      LogsSelectors.selectIsAuditLogLoading.setResult(false);
      LogsSelectors.selectSkipAuditLog.setResult(1);
      LogsSelectors.selectTotalAuditLogs.setResult(10);
      LogsSelectors.selectAuditFilterType.setResult(LOG_TYPE.EXPERIMENT_CREATED);

      logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = LogsActions.actionGetAuditLogsFailure();

      service.getAllAuditLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetAuditLogs({ fromStart: true }));

      tick(0);
    }));
  });

  describe('getAllErrorLogs$', () => {
    it('should do nothing if isErrorLogLoading is true and skipErrorLog < totalErrorLogs, totalErrorlogs is not null, and fromStarting is true', fakeAsync(() => {
      let neverEmitted = true;
      LogsSelectors.selectIsErrorLogLoading.setResult(true);
      LogsSelectors.selectSkipErrorLog.setResult(1);
      LogsSelectors.selectTotalErrorLogs.setResult(10);

      service.getAllErrorLogs$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(LogsActions.actionGetErrorLogs({ fromStart: true }));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should do nothing if isErrorLogLoading is false and skipErrorLog > totalErrorLogs, and fromStarting is falsey', fakeAsync(() => {
      let neverEmitted = true;
      LogsSelectors.selectIsErrorLogLoading.setResult(false);
      LogsSelectors.selectSkipErrorLog.setResult(11);
      LogsSelectors.selectTotalErrorLogs.setResult(10);

      service.getAllErrorLogs$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(LogsActions.actionGetErrorLogs({}));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should always dispatch actionSetIsErrorLogLoading if not filtered out', fakeAsync(() => {
      LogsSelectors.selectIsErrorLogLoading.setResult(false);
      LogsSelectors.selectSkipErrorLog.setResult(1);
      LogsSelectors.selectTotalErrorLogs.setResult(10);
      LogsSelectors.selectErrorFilterType.setResult(SERVER_ERROR.ASSIGNMENT_ERROR);

      service.getAllErrorLogs$.subscribe();

      actions$.next(LogsActions.actionGetErrorLogs({}));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
      expect(store$.dispatch).not.toHaveBeenCalledWith(LogsActions.actionSetSkipErrorLog({ skipErrorLog: 0 }));
    }));

    it('should dispatch actionSetSkipErrorLog if not filtered out and fromStarting is true', fakeAsync(() => {
      LogsSelectors.selectIsErrorLogLoading.setResult(false);
      LogsSelectors.selectSkipErrorLog.setResult(1);
      LogsSelectors.selectTotalErrorLogs.setResult(10);
      LogsSelectors.selectErrorFilterType.setResult(SERVER_ERROR.ASSIGNMENT_ERROR);

      service.getAllErrorLogs$.subscribe();

      actions$.next(LogsActions.actionGetErrorLogs({ fromStart: true }));

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetIsErrorLogLoading({ isErrorLogLoading: true }));
      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionSetSkipErrorLog({ skipErrorLog: 0 }));
    }));

    it('should dispatch actionGetErrorLogsSuccess if valid request is successful from service', fakeAsync(() => {
      LogsSelectors.selectIsErrorLogLoading.setResult(false);
      LogsSelectors.selectSkipErrorLog.setResult(1);
      LogsSelectors.selectTotalErrorLogs.setResult(10);
      LogsSelectors.selectErrorFilterType.setResult(SERVER_ERROR.ASSIGNMENT_ERROR);

      const mockReturnData = {
        nodes: [],
        total: 0,
      };

      logsDataService.getAllErrorLogs = jest.fn().mockReturnValue(of(mockReturnData));

      const expectedAction = LogsActions.actionGetErrorLogsSuccess({
        errorLogs: [],
        totalErrorLogs: 0,
      });

      service.getAllErrorLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetErrorLogs({ fromStart: true }));

      tick(0);
    }));

    it('should dispatch actionGetErrorLogsFailure if valid request errors from service', fakeAsync(() => {
      LogsSelectors.selectIsErrorLogLoading.setResult(false);
      LogsSelectors.selectSkipErrorLog.setResult(1);
      LogsSelectors.selectTotalErrorLogs.setResult(10);
      LogsSelectors.selectErrorFilterType.setResult(SERVER_ERROR.ASSIGNMENT_ERROR);

      logsDataService.getAllErrorLogs = jest.fn().mockReturnValue(throwError(() => new Error('test')));

      const expectedAction = LogsActions.actionGetErrorLogsFailure();

      service.getAllErrorLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetErrorLogs({ fromStart: true }));

      tick(0);
    }));
  });

  describe('changeAuditFilter', () => {
    it('should always dispatch actionGetAuditLogs(fromStart: true)', fakeAsync(() => {
      service.changeAuditFilter$.subscribe();

      actions$.next(
        LogsActions.actionSetAuditLogFilter({
          filterType: LOG_TYPE.EXPERIMENT_CREATED,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionGetAuditLogs({ fromStart: true }));
    }));
  });

  describe('changeErrorFilter', () => {
    it('should always dispatch actionGetAuditLogs(fromStart: true)', fakeAsync(() => {
      service.changeErrorFilter$.subscribe();

      actions$.next(
        LogsActions.actionSetErrorLogFilter({
          filterType: SERVER_ERROR.CONDITION_NOT_FOUND,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(LogsActions.actionGetErrorLogs({ fromStart: true }));
    }));
  });

  describe('getExperimentLogs$', () => {
    beforeEach(() => {
      LogsSelectors.selectExperimentLogsState.setResult({});
    });

    it('should dispatch actionGetExperimentLogsSuccess when service call succeeds', fakeAsync(() => {
      const experimentId = 'exp-123';
      const mockReturnData = {
        nodes: [],
        total: 5,
      };

      logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(of(mockReturnData));

      const expectedAction = LogsActions.actionGetExperimentLogsSuccess({
        experimentId,
        auditLogs: [],
        totalAuditLogs: 5,
        fromStart: false,
      });

      service.getExperimentLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetExperimentLogs({ experimentId }));

      tick(0);
    }));

    it('should dispatch actionGetExperimentLogsFailure when service call fails', fakeAsync(() => {
      const experimentId = 'exp-123';

      logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(throwError(() => new Error('test error')));

      const expectedAction = LogsActions.actionGetExperimentLogsFailure({ experimentId });

      service.getExperimentLogs$.subscribe((result) => {
        expect(result).toEqual(expectedAction);
      });

      actions$.next(LogsActions.actionGetExperimentLogs({ experimentId }));

      tick(0);
    }));

    it('should not fetch if all logs already fetched and fromStart is false', fakeAsync(() => {
      const experimentId = 'exp-123';
      LogsSelectors.selectExperimentLogsState.setResult({
        [experimentId]: { skip: 10, total: 10, logs: [], isLoading: false, filter: null },
      });

      let neverEmitted = true;

      service.getExperimentLogs$.subscribe(() => {
        neverEmitted = false;
      });

      actions$.next(LogsActions.actionGetExperimentLogs({ experimentId, fromStart: false }));

      tick(0);

      expect(neverEmitted).toEqual(true);
    }));

    it('should fetch with filter when metadata has filter set', fakeAsync(() => {
      const experimentId = 'exp-123';
      const filter = LOG_TYPE.EXPERIMENT_UPDATED;
      LogsSelectors.selectExperimentLogsState.setResult({
        [experimentId]: { skip: 0, total: null, logs: [], isLoading: false, filter },
      });

      const mockReturnData = {
        nodes: [],
        total: 5,
      };

      logsDataService.getAllAuditLogs = jest.fn().mockReturnValue(of(mockReturnData));

      service.getExperimentLogs$.subscribe();

      actions$.next(LogsActions.actionGetExperimentLogs({ experimentId }));

      tick(0);

      expect(logsDataService.getAllAuditLogs).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        experimentId,
        filter,
      });
    }));
  });

  describe('changeExperimentLogFilter$', () => {
    it('should dispatch actionGetExperimentLogs with fromStart: true', fakeAsync(() => {
      const experimentId = 'exp-123';

      service.changeExperimentLogFilter$.subscribe();

      actions$.next(
        LogsActions.actionSetExperimentLogFilter({
          experimentId,
          filterType: LOG_TYPE.EXPERIMENT_CREATED,
        })
      );

      tick(0);

      expect(store$.dispatch).toHaveBeenCalledWith(
        LogsActions.actionGetExperimentLogs({ experimentId, fromStart: true })
      );
    }));
  });
});
