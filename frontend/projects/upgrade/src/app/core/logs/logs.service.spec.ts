import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import * as ExperimentSelectors from '../experiments/store/experiments.selectors';
import { LogsService } from './logs.service';
import * as LogActions from './store/logs.actions';
import { AuditLogs, EXPERIMENT_LOG_TYPE, SERVER_ERROR } from './store/logs.model';
import * as LogSelectors from './store/logs.selectors';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('LogsService', () => {
  let mockStore: any;
  let service: LogsService;
  const mockAuditLog: AuditLogs = {
    id: 'log1',
    createdAt: 'test',
    updatedAt: 'test',
    versionNumber: 2,
    type: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
    data: {},
  };

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new LogsService(mockStore);
  });

  describe('#getAuditLogs', () => {
    const testCases = [
      {
        whenCondition: 'experimentId is not present, set log to isExperimentExist false',
        expectedValue: {
          ...mockAuditLog,
          data: {
            experimentId: null,
            isExperimentExist: false,
          },
        },
        logs: [
          {
            ...mockAuditLog,
            data: {
              experimentId: null,
            },
          },
        ],
        experiments: [
          {
            id: null,
          },
        ],
      },
      {
        whenCondition: 'experimentId matched, set log to isExperimentExist true',
        expectedValue: {
          ...mockAuditLog,
          data: {
            experimentId: '1',
            isExperimentExist: true,
          },
        },
        logs: [
          {
            ...mockAuditLog,
            data: {
              experimentId: '1',
            },
          },
        ],
        experiments: [
          {
            id: '1',
          },
        ],
      },
      {
        whenCondition: 'experimentId NOT matched, set log to isExperimentExist false',
        expectedValue: {
          ...mockAuditLog,
          data: {
            experimentId: '1',
            isExperimentExist: false,
          },
        },
        logs: [
          {
            ...mockAuditLog,
            data: {
              experimentId: '1',
            },
          },
        ],
        experiments: [
          {
            id: '2',
          },
        ],
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, logs, experiments } = testCase;

      it(`WHEN ${whenCondition}, THEN expected value is ${JSON.stringify(expectedValue)}`, fakeAsync(() => {
        LogSelectors.selectAllAuditLogs.setResult([...logs]);
        ExperimentSelectors.selectAllExperiment.setResult([...experiments] as any);

        service.getAuditLogs().subscribe((val) => {
          tick(0);
          expect(val[0]).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#isAllAuditLogsFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipLogs: 0,
        totalLogs: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipLogs: 1,
        totalLogs: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipLogs, totalLogs } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        LogSelectors.selectSkipAuditLog.setResult(skipLogs);
        LogSelectors.selectTotalAuditLogs.setResult(totalLogs);

        service.isAllAuditLogsFetched().subscribe((val) => {
          tick(0);
          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#isAllErrorLogsFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipLogs: 0,
        totalLogs: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipLogs: 1,
        totalLogs: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipLogs, totalLogs } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        LogSelectors.selectSkipErrorLog.setResult(skipLogs);
        LogSelectors.selectTotalErrorLogs.setResult(totalLogs);

        service.isAllErrorLogsFetched().subscribe((val) => {
          tick(0);
          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#fetchAuditLogs', () => {
    it('should dispatch actionGetAuditLogs with fromStart defined', () => {
      const fromStart = true;

      service.fetchAuditLogs(fromStart);

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionGetAuditLogs({ fromStart }));
    });

    it('should dispatch actionGetAuditLogs with fromStart defined', () => {
      service.fetchAuditLogs();

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionGetAuditLogs({ fromStart: undefined }));
    });
  });

  describe('#fetchErrorLogs', () => {
    it('should dispatch actionGetErrorLogs with fromStart defined', () => {
      const fromStart = true;

      service.fetchErrorLogs(fromStart);

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionGetErrorLogs({ fromStart }));
    });

    it('should dispatch actionGetErrorLogs with fromStart defined', () => {
      service.fetchErrorLogs();

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionGetErrorLogs({ fromStart: undefined }));
    });
  });

  describe('#setAuditLogFilter', () => {
    it('should dispatch actionSetAuditLogFilter with filterType', () => {
      const filterType = EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED;

      service.setAuditLogFilter(filterType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionSetAuditLogFilter({ filterType }));
    });
  });

  describe('#setErrorLogFilter', () => {
    it('should dispatch actionSetAuditLogFilter with filterType', () => {
      const filterType = SERVER_ERROR.ASSIGNMENT_ERROR;

      service.setErrorLogFilter(filterType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(LogActions.actionSetErrorLogFilter({ filterType }));
    });
  });
});
