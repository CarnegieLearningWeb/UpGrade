import { initialState, logsReducer } from './logs.reducer';
import * as LogsActions from './logs.actions';
import { AuditLogs, ErrorLogs, EXPERIMENT_LOG_TYPE, SERVER_ERROR } from './logs.model';

describe('LogsReducer', () => {
  const mockAuditLogs: AuditLogs[] = [
    {
      id: 'abc123',
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 0,
      type: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
      data: 'test1',
    },
    {
      id: 'xyz789',
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 0,
      type: EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED,
      data: 'test2',
    },
  ];

  const mockErrorLogs: ErrorLogs[] = [
    {
      id: 'abc123',
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 0,
      type: SERVER_ERROR.DB_AUTH_FAIL,
      endPoint: 'assign',
      errorCode: 500,
      message: 'test1',
      name: 'errorTest1',
    },
    {
      id: 'xyz789',
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 0,
      type: SERVER_ERROR.DB_AUTH_FAIL,
      endPoint: 'assign',
      errorCode: 500,
      message: 'test2',
      name: 'errorTest2',
    },
  ];

  it('should handle actionGetAuditLogs by returning copy of entire state', () => {
    const previousState = { ...initialState };
    const testAction = LogsActions.actionGetAuditLogs({});

    const newState = logsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual(previousState);
  });

  it('should handle actionGetAuditLogsSuccess by setting auditLogs entitites, isAuditLogLoading to false, totalAuditLogs number, and recalc skipAuditLog offset', () => {
    const previousState = { ...initialState };
    previousState.entities = null;
    previousState.isAuditLogLoading = true;
    previousState.skipAuditLog = 0;
    previousState.totalAuditLogs = 1;
    const testAction = LogsActions.actionGetAuditLogsSuccess({
      auditLogs: [...mockAuditLogs],
      totalAuditLogs: 2,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.entities).toEqual({
      [mockAuditLogs[0].id]: { ...mockAuditLogs[0] },
      [mockAuditLogs[1].id]: { ...mockAuditLogs[1] },
    });
    expect(newState.isAuditLogLoading).toEqual(false);
    expect(newState.skipAuditLog).toEqual(2);
    expect(newState.totalAuditLogs).toEqual(2);
  });

  it('should handle actionGetAuditLogsFailure by setting isAuditLogLoading to false', () => {
    const previousState = { ...initialState };
    previousState.isAuditLogLoading = true;
    const testAction = LogsActions.actionGetAuditLogsFailure();

    const newState = logsReducer(previousState, testAction);

    expect(newState.isAuditLogLoading).toEqual(false);
  });

  it('should handle actionGetErrorLogs by returning copy of entire state', () => {
    const previousState = { ...initialState };
    const testAction = LogsActions.actionGetErrorLogs({});

    const newState = logsReducer(previousState, testAction);

    expect(newState).not.toBe(previousState);
    expect(newState).toEqual(previousState);
  });

  it('should handle actionGetErrorLogsSuccess by setting ErrorLogs entitites, isErrorLogLoading to false, totalErrorLogs number, and recalc skipErrorLog offset', () => {
    const previousState = { ...initialState };
    previousState.entities = null;
    previousState.isErrorLogLoading = true;
    previousState.skipErrorLog = 0;
    previousState.totalErrorLogs = 1;
    const testAction = LogsActions.actionGetErrorLogsSuccess({
      errorLogs: [...mockErrorLogs],
      totalErrorLogs: 2,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.entities).toEqual({
      [mockErrorLogs[0].id]: { ...mockErrorLogs[0] },
      [mockErrorLogs[1].id]: { ...mockErrorLogs[1] },
    });
    expect(newState.isErrorLogLoading).toEqual(false);
    expect(newState.skipErrorLog).toEqual(2);
    expect(newState.totalErrorLogs).toEqual(2);
  });

  it('should handle actionGetErrorLogsFailure by setting isErrorLogLoading to false', () => {
    const previousState = { ...initialState };
    previousState.isErrorLogLoading = true;
    const testAction = LogsActions.actionGetErrorLogsFailure();

    const newState = logsReducer(previousState, testAction);

    expect(newState.isErrorLogLoading).toEqual(false);
  });

  it('should handle actionGetErrorLogsFailure by setting isErrorLogLoading to false', () => {
    const previousState = { ...initialState };
    previousState.isErrorLogLoading = true;
    const testAction = LogsActions.actionGetErrorLogsFailure();

    const newState = logsReducer(previousState, testAction);

    expect(newState.isErrorLogLoading).toEqual(false);
  });

  it('should handle actionSetSkipAuditLog by setting skipAuditLog to provided value', () => {
    const previousState = { ...initialState };
    previousState.skipAuditLog = 1;
    const testAction = LogsActions.actionSetSkipAuditLog({
      skipAuditLog: 2,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.skipAuditLog).toEqual(2);
  });

  it('should handle actionSetSkipErrorLog by setting skipErrorLog to provided value', () => {
    const previousState = { ...initialState };
    previousState.skipErrorLog = 1;
    const testAction = LogsActions.actionSetSkipErrorLog({
      skipErrorLog: 2,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.skipErrorLog).toEqual(2);
  });

  it('should handle actionSetIsAuditLogLoading by setting isAuditLogLoading to provided value', () => {
    const previousState = { ...initialState };
    previousState.isAuditLogLoading = false;
    const testAction = LogsActions.actionSetIsAuditLogLoading({
      isAuditLogLoading: true,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.isAuditLogLoading).toEqual(true);
  });

  it('should handle actionSetIsErrorLogLoading by setting isErrorLogLoading to provided value', () => {
    const previousState = { ...initialState };
    previousState.isErrorLogLoading = false;
    const testAction = LogsActions.actionSetIsErrorLogLoading({
      isErrorLogLoading: true,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.isErrorLogLoading).toEqual(true);
  });

  it('should handle actionSetAuditLogFilter by setting filterType to provided value', () => {
    const previousState = { ...initialState };
    previousState.auditLogFilter = EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED;
    const testAction = LogsActions.actionSetAuditLogFilter({
      filterType: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.auditLogFilter).toEqual(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
  });

  it('should handle actionSetErrorLogFilter by setting filterType to provided value', () => {
    const previousState = { ...initialState };
    previousState.errorLogFilter = SERVER_ERROR.EMAIL_SEND_ERROR;
    const testAction = LogsActions.actionSetErrorLogFilter({
      filterType: SERVER_ERROR.INCORRECT_PARAM_FORMAT,
    });

    const newState = logsReducer(previousState, testAction);

    expect(newState.errorLogFilter).toEqual(SERVER_ERROR.INCORRECT_PARAM_FORMAT);
  });
});
