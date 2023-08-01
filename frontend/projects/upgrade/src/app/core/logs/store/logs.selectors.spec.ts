import { AuditLogs, EXPERIMENT_LOG_TYPE, ErrorLogs, SERVER_ERROR } from './logs.model';
import { initialState } from './logs.reducer';
import * as LogsSelectors from './logs.selectors';

describe('LogsSelectors', () => {
  const mockState = { ...initialState };

  describe('#selectIsAuditLogLoading', () => {
    it('should return a boolean from isErrorLogLoading', () => {
      const state = { ...mockState };
      state.isAuditLogLoading = true;

      const result = LogsSelectors.selectIsAuditLogLoading.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectIsErrorLogLoading', () => {
    it('should return a boolean from isErrorLogLoading', () => {
      const state = { ...mockState };
      state.isErrorLogLoading = true;

      const result = LogsSelectors.selectIsErrorLogLoading.projector(state);

      expect(result).toEqual(true);
    });
  });

  describe('#selectAllAuditLogs', () => {
    it('should return an array of logs that contain the filtertype given', () => {
      const state = { ...mockState };
      state.auditLogFilter = EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED;
      const mockAuditLog: AuditLogs = {
        id: 'abc',
        createdAt: '2020-10-10',
        updatedAt: '2020-10-10',
        data: {},
        versionNumber: 1,
        type: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
      };

      const result = LogsSelectors.selectAllAuditLogs.projector(state, [
        { ...mockAuditLog, type: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED },
        { ...mockAuditLog, type: EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_EXPORTED },
      ]);

      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('#selectAllErrorLogs', () => {
    it('should return an array of logs that contain the filtertype given', () => {
      const state = { ...mockState };
      state.errorLogFilter = SERVER_ERROR.CONDITION_NOT_FOUND;
      const mockErrorLog: ErrorLogs = {
        id: 'abc',
        createdAt: '2020-10-10',
        updatedAt: '2020-10-10',
        versionNumber: 1,
        type: SERVER_ERROR.CONDITION_NOT_FOUND,
        endPoint: 'test',
        errorCode: 500,
        message: 'test',
        name: 'test',
      };

      const result = LogsSelectors.selectAllErrorLogs.projector(state, [
        { ...mockErrorLog, type: SERVER_ERROR.CONDITION_NOT_FOUND },
        { ...mockErrorLog, type: SERVER_ERROR.DB_AUTH_FAIL },
      ]);

      expect(result).toEqual([mockErrorLog]);
    });
  });

  describe('#selectSkipAuditLog', () => {
    it('should return a number from skipAuditLog', () => {
      const state = { ...mockState };
      state.skipAuditLog = 2;

      const result = LogsSelectors.selectSkipAuditLog.projector(state);

      expect(result).toEqual(2);
    });
  });

  describe('#selectTotalAuditLogs', () => {
    it('should return a number from totalAuditLogs', () => {
      const state = { ...mockState };
      state.totalAuditLogs = 10;

      const result = LogsSelectors.selectTotalAuditLogs.projector(state);

      expect(result).toEqual(10);
    });
  });

  describe('#selectSkipErrorLog', () => {
    it('should return a number from skipErrorLog', () => {
      const state = { ...mockState };
      state.skipErrorLog = 3;

      const result = LogsSelectors.selectSkipErrorLog.projector(state);

      expect(result).toEqual(3);
    });
  });

  describe('#selectTotalErrorLogs', () => {
    it('should return a number from totalErrorLogs', () => {
      const state = { ...mockState };
      state.totalErrorLogs = 10;

      const result = LogsSelectors.selectTotalErrorLogs.projector(state);

      expect(result).toEqual(10);
    });
  });

  describe('#selectAuditFilterType', () => {
    it('should return a EXPERIMENT_LOG_TYPE from auditLogFilter', () => {
      const state = { ...mockState };
      state.auditLogFilter = EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED;

      const result = LogsSelectors.selectAuditFilterType.projector(state);

      expect(result).toEqual(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);
    });
  });

  describe('#selectErrorFilterType', () => {
    it('should return a SERVER_ERROR from erroerrorLogFilterrLogFilter', () => {
      const state = { ...mockState };
      state.errorLogFilter = SERVER_ERROR.CONDITION_NOT_FOUND;

      const result = LogsSelectors.selectErrorFilterType.projector(state);

      expect(result).toEqual(SERVER_ERROR.CONDITION_NOT_FOUND);
    });
  });
});
