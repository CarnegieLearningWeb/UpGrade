import { AuditLogs, ErrorLogs } from './logs.model';
import { initialState } from './logs.reducer';
import * as LogsSelectors from './logs.selectors';
import { LOG_TYPE, SERVER_ERROR } from 'upgrade_types';

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
      state.auditLogFilter = LOG_TYPE.EXPERIMENT_CREATED;
      const mockAuditLog: AuditLogs = {
        id: 'abc',
        createdAt: '2020-10-10',
        updatedAt: '2020-10-10',
        data: {},
        versionNumber: 1,
        type: LOG_TYPE.EXPERIMENT_CREATED,
      };

      const result = LogsSelectors.selectAllAuditLogs.projector(state, [
        { ...mockAuditLog, type: LOG_TYPE.EXPERIMENT_CREATED },
        { ...mockAuditLog, type: LOG_TYPE.EXPERIMENT_DATA_EXPORTED },
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
    it('should return a LOG_TYPE from auditLogFilter', () => {
      const state = { ...mockState };
      state.auditLogFilter = LOG_TYPE.EXPERIMENT_CREATED;

      const result = LogsSelectors.selectAuditFilterType.projector(state);

      expect(result).toEqual(LOG_TYPE.EXPERIMENT_CREATED);
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

  describe('#selectExperimentLogsState', () => {
    it('should return the experimentAuditLogs from state', () => {
      const state = { ...mockState };
      const experimentLogs = {
        'exp-123': { logs: [], skip: 0, total: 10, isLoading: false, filter: null },
      };
      state.experimentAuditLogs = experimentLogs;

      const result = LogsSelectors.selectExperimentLogsState.projector(state);

      expect(result).toEqual(experimentLogs);
    });
  });

  describe('#selectExperimentLogsMetadata', () => {
    it('should return metadata for specific experiment', () => {
      const experimentLogs = {
        'exp-123': { logs: [], skip: 5, total: 10, isLoading: false, filter: null },
      };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectExperimentLogsMetadata.projector(experimentLogs, props);

      expect(result).toEqual(experimentLogs['exp-123']);
    });

    it('should return null if experiment not found', () => {
      const experimentLogs = {};
      const props = { experimentId: 'exp-456' };

      const result = LogsSelectors.selectExperimentLogsMetadata.projector(experimentLogs, props);

      expect(result).toBeNull();
    });
  });

  describe('#selectExperimentLogs', () => {
    it('should return logs array from metadata', () => {
      const mockLogs: AuditLogs[] = [
        {
          id: 'log1',
          createdAt: '2020-10-10',
          updatedAt: '2020-10-10',
          data: {},
          versionNumber: 1,
          type: LOG_TYPE.EXPERIMENT_CREATED,
        },
      ];
      const metadata = { logs: mockLogs, skip: 1, total: 1, isLoading: false, filter: null };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectExperimentLogs.projector(metadata, props);

      expect(result).toEqual(mockLogs);
    });

    it('should return empty array if metadata is null', () => {
      const props = { experimentId: 'exp-456' };

      const result = LogsSelectors.selectExperimentLogs.projector(null, props);

      expect(result).toEqual([]);
    });
  });

  describe('#selectIsExperimentLogsLoading', () => {
    it('should return isLoading from metadata', () => {
      const metadata = { logs: [], skip: 0, total: 10, isLoading: true, filter: null };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectIsExperimentLogsLoading.projector(metadata, props);

      expect(result).toEqual(true);
    });

    it('should return false if metadata is null', () => {
      const props = { experimentId: 'exp-456' };

      const result = LogsSelectors.selectIsExperimentLogsLoading.projector(null, props);

      expect(result).toEqual(false);
    });
  });

  describe('#selectIsAllExperimentLogsFetched', () => {
    it('should return true when skip equals total', () => {
      const metadata = { logs: [], skip: 10, total: 10, isLoading: false, filter: null };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectIsAllExperimentLogsFetched.projector(metadata, props);

      expect(result).toEqual(true);
    });

    it('should return false when skip is less than total', () => {
      const metadata = { logs: [], skip: 5, total: 10, isLoading: false, filter: null };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectIsAllExperimentLogsFetched.projector(metadata, props);

      expect(result).toEqual(false);
    });

    it('should return false when metadata is null', () => {
      const props = { experimentId: 'exp-456' };

      const result = LogsSelectors.selectIsAllExperimentLogsFetched.projector(null, props);

      expect(result).toEqual(false);
    });

    it('should return false when total is null', () => {
      const metadata = { logs: [], skip: 5, total: null, isLoading: false, filter: null };
      const props = { experimentId: 'exp-123' };

      const result = LogsSelectors.selectIsAllExperimentLogsFetched.projector(metadata, props);

      expect(result).toEqual(false);
    });
  });

  describe('#selectFeatureFlagLogsState', () => {
    it('should return the featureFlagAuditLogs from state', () => {
      const state = { ...mockState };
      const flagLogs = {
        'flag-123': { logs: [], skip: 0, total: 10, isLoading: false, filter: null },
      };
      state.featureFlagAuditLogs = flagLogs;

      const result = LogsSelectors.selectFeatureFlagLogsState.projector(state);

      expect(result).toEqual(flagLogs);
    });
  });

  describe('#selectFeatureFlagLogsMetadata', () => {
    it('should return metadata for specific flag', () => {
      const flagLogs = {
        'flag-123': { logs: [], skip: 5, total: 10, isLoading: false, filter: null },
      };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectFeatureFlagLogsMetadata.projector(flagLogs, props);

      expect(result).toEqual(flagLogs['flag-123']);
    });

    it('should return null if flag not found', () => {
      const flagLogs = {};
      const props = { flagId: 'flag-456' };

      const result = LogsSelectors.selectFeatureFlagLogsMetadata.projector(flagLogs, props);

      expect(result).toBeNull();
    });
  });

  describe('#selectFeatureFlagLogs', () => {
    it('should return logs array from metadata', () => {
      const mockLogs: AuditLogs[] = [
        {
          id: 'log1',
          createdAt: '2020-10-10',
          updatedAt: '2020-10-10',
          data: {},
          versionNumber: 1,
          type: LOG_TYPE.FEATURE_FLAG_CREATED,
        },
      ];
      const metadata = { logs: mockLogs, skip: 1, total: 1, isLoading: false, filter: null };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectFeatureFlagLogs.projector(metadata, props);

      expect(result).toEqual(mockLogs);
    });

    it('should return empty array if metadata is null', () => {
      const props = { flagId: 'flag-456' };

      const result = LogsSelectors.selectFeatureFlagLogs.projector(null, props);

      expect(result).toEqual([]);
    });
  });

  describe('#selectIsFeatureFlagLogsLoading', () => {
    it('should return isLoading from metadata', () => {
      const metadata = { logs: [], skip: 0, total: 10, isLoading: true, filter: null };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectIsFeatureFlagLogsLoading.projector(metadata, props);

      expect(result).toEqual(true);
    });

    it('should return false if metadata is null', () => {
      const props = { flagId: 'flag-456' };

      const result = LogsSelectors.selectIsFeatureFlagLogsLoading.projector(null, props);

      expect(result).toEqual(false);
    });
  });

  describe('#selectIsAllFeatureFlagLogsFetched', () => {
    it('should return true when skip equals total', () => {
      const metadata = { logs: [], skip: 10, total: 10, isLoading: false, filter: null };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectIsAllFeatureFlagLogsFetched.projector(metadata, props);

      expect(result).toEqual(true);
    });

    it('should return false when skip is less than total', () => {
      const metadata = { logs: [], skip: 5, total: 10, isLoading: false, filter: null };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectIsAllFeatureFlagLogsFetched.projector(metadata, props);

      expect(result).toEqual(false);
    });

    it('should return false when metadata is null', () => {
      const props = { flagId: 'flag-456' };

      const result = LogsSelectors.selectIsAllFeatureFlagLogsFetched.projector(null, props);

      expect(result).toEqual(false);
    });

    it('should return false when total is null', () => {
      const metadata = { logs: [], skip: 5, total: null, isLoading: false, filter: null };
      const props = { flagId: 'flag-123' };

      const result = LogsSelectors.selectIsAllFeatureFlagLogsFetched.projector(metadata, props);

      expect(result).toEqual(false);
    });
  });
});
