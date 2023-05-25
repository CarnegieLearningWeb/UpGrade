import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from '../core.module';
import { ExperimentService } from './experiments.service';
import {
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  DATE_RANGE,
  ExperimentLocalStorageKeys,
  ExperimentVM,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
  EXPERIMENT_STATE,
  POST_EXPERIMENT_RULE,
  UpsertExperimentType,
} from './store/experiments.model';
import * as ExperimentSelectors from './store/experiments.selectors';
import {
  actionDeleteExperiment,
  actionExportExperimentDesign,
  actionExportExperimentInfo,
  actionFetchAllExperimentNames,
  actionFetchContextMetaData,
  actionFetchExperimentDetailStat,
  actionGetExperimentById,
  actionGetExperiments,
  actionSetGraphRange,
  actionSetSearchKey,
  actionSetSearchString,
  actionSetSortingType,
  actionSetSortKey,
  actionUpdateExperimentState,
  actionUpsertExperiment,
} from './store/experiments.actions';
import { Environment } from '../../../environments/environment-types';
import { environment } from '../../../environments/environment';
import { CONDITION_ORDER, EXPERIMENT_TYPE, FILTER_MODE, SEGMENT_TYPE } from 'upgrade_types';
import { segmentNew } from './store/experiments.model';
import { Segment } from '../segments/store/segments.model';
// import { SEGMENT_TYPE } from 'upgrade_types';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

class MockLocalStorageService extends LocalStorageService {
  setItem = jest.fn();
}

describe('ExperimentService', () => {
  let mockStore: any;
  let mockLocalStorageService: LocalStorageService;
  let mockEnvironment: Environment;
  let service: ExperimentService;
  const mockExperimentsList: any = [
    { id: 'fourth', createdAt: '04/23/17 04:34:22 +0000' },
    { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
    { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
    { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
  ];

  const segmentData: Segment = {
    id: 'segment-id',
    name: 'segment-name',
    description: 'segment-description',
    createdAt: '04/23/17 04:34:22 +0000',
    updatedAt: '04/23/17 04:34:22 +0000',
    versionNumber: 1,
    context: 'segment-context',
    individualForSegment: [],
    groupForSegment: [],
    subSegments: [],
    type: SEGMENT_TYPE.PUBLIC,
    status: 'segment-status',
  };

  const dummyInclusionData: segmentNew = {
    updatedAt: '2022-06-20T13:14:52.900Z',
    createdAt: '2022-06-20T13:14:52.900Z',
    versionNumber: 1,
    segment: segmentData,
  };

  const dummyExclusionData: segmentNew = {
    updatedAt: '2022-06-20T13:14:52.900Z',
    createdAt: '2022-06-20T13:14:52.900Z',
    versionNumber: 1,
    segment: segmentData,
  };

  const mockExperiment = {
    id: 'abc123',
    name: 'abc123',
    description: 'abc123',
    createdAt: 'time',
    updatedAt: 'time',
    versionNumber: 0,
    state: EXPERIMENT_STATE.INACTIVE,
    context: [],
    startOn: 'test',
    consistencyRule: CONSISTENCY_RULE.INDIVIDUAL,
    assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
    conditionOrder: CONDITION_ORDER.RANDOM,
    postExperimentRule: POST_EXPERIMENT_RULE.ASSIGN,
    enrollmentCompleteCondition: {
      userCount: 1,
      groupCount: 2,
    },
    endOn: 'test',
    revertTo: 'test',
    tags: [],
    group: 'test',
    logging: true,
    conditions: [],
    partitions: [],
    factors: [],
    conditionPayloads: [],
    queries: [],
    stateTimeLogs: [],
    filterMode: FILTER_MODE.INCLUDE_ALL,
    experimentSegmentInclusion: dummyInclusionData,
    experimentSegmentExclusion: dummyExclusionData,
    backendVersion: '1.0.0',
    groupSatisfied: 0,
    type: EXPERIMENT_TYPE.SIMPLE,
  };
  const mockExperimentStateInfo = {
    newStatus: EXPERIMENT_STATE.INACTIVE,
    scheduleDate: 'never!',
  };
  const mockExperimentSearchKey = EXPERIMENT_SEARCH_KEY.ALL;

  beforeEach(() => {
    mockStore = MockStateStore$;
    mockLocalStorageService = new MockLocalStorageService();
    mockEnvironment = { ...environment };
    service = new ExperimentService(mockStore, mockLocalStorageService, mockEnvironment);
  });

  describe('#experiments$', () => {
    it('should emit sorted list of entities', fakeAsync(() => {
      ExperimentSelectors.selectAllExperiment.setResult(mockExperimentsList);

      mockStore.next('thisValueIsMeaningless');

      service.experiments$.subscribe((val) => {
        tick(0);
        expect(val).toEqual([
          { id: 'first', createdAt: '04/25/17 04:34:22 +0000' },
          { id: 'second', createdAt: '04/24/17 04:34:22 +0000' },
          { id: 'third', createdAt: '04/24/17 04:34:22 +0000' },
          { id: 'fourth', createdAt: '04/23/17 04:34:22 +0000' },
        ]);
      });
    }));
  });

  describe('#experimentStatById$', () => {
    it('should ', () => {
      const mockId = 'test';
      const pipeSpy = jest.spyOn(mockStore, 'pipe');

      service.experimentStatById$(mockId);

      expect(pipeSpy).toHaveBeenCalled();
    });
  });

  describe('#selectSearchExperimentParams', () => {
    it('should emit a new object from the combined last values of searchkey and searchstring', fakeAsync(() => {
      service.selectSearchKey$ = of(EXPERIMENT_SEARCH_KEY.ALL);
      service.selectSearchString$ = of('test');
      const expectedResult = {
        searchKey: EXPERIMENT_SEARCH_KEY.ALL,
        searchString: 'test',
      };

      service.selectSearchExperimentParams().subscribe((val) => {
        tick(0);
        expect(val).toEqual(expectedResult);
      });
    }));

    describe('should throw error if one or both of the values is falsey:', () => {
      const expectedError = 'no elements in sequence';
      const testCases = [
        {
          searchKey: null,
          searchString: 'test',
          description: 'searchKey is null',
        },
        {
          searchKey: undefined,
          searchString: 'test',
          description: 'searchKey is undefined',
        },
        {
          searchKey: '',
          searchString: 'test',
          description: 'searchKey is empty string',
        },
        {
          searchKey: null,
          searchString: 'test',
          description: 'searchString is null',
        },
        {
          searchKey: undefined,
          searchString: 'test',
          description: 'searchString is undefined',
        },
        {
          searchKey: '',
          searchString: 'test',
          description: 'searchString is empty string',
        },
        {
          searchKey: null,
          searchString: '',
          description: 'Both are falsey',
        },
      ];

      testCases.forEach((testCase) => {
        it(`${testCase.description}`, fakeAsync(() => {
          (service.selectSearchKey$ as any) = of(testCase.searchKey);
          service.selectSearchString$ = of(testCase.searchString);

          service
            .selectSearchExperimentParams()
            .pipe(catchError((err) => of(err)))
            .subscribe((err: Error) => {
              tick(0);
              expect(err.message).toBe(expectedError);
            });
        }));
      });
    });
  });

  describe('#isInitialExperimentsLoading', () => {
    describe('should return true if experiments are not loading and experiment data exists, and false otherwise', () => {
      const testCases = [
        {
          whenCondition: 'is NOT in loadingstate AND has experiments',
          expectedValue: true,
          isLoading: false,
          experiments: mockExperimentsList,
        },
        {
          whenCondition: 'is NOT loading AND has NO experiments',
          expectedValue: true,
          isLoading: false,
          experiments: [],
        },
        {
          whenCondition: 'is loading AND has NO experiments',
          expectedValue: false,
          isLoading: true,
          experiments: [],
        },
        {
          whenCondition: 'is loading AND has experiments',
          expectedValue: true,
          isLoading: true,
          experiments: mockExperimentsList,
        },
      ];

      testCases.forEach((testCase) => {
        const { whenCondition, expectedValue, isLoading, experiments } = testCase;

        it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
          ExperimentSelectors.selectIsLoadingExperiment.setResult(isLoading);
          ExperimentSelectors.selectAllExperiment.setResult(experiments);

          service.isInitialExperimentsLoading().subscribe((val) => {
            tick(0);
            expect(val).toBe(expectedValue);
          });
        }));
      });
    });
  });

  describe('#isAllExperimentFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipExperiments: 0,
        totalExperiments: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipExperiments: 1,
        totalExperiments: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipExperiments, totalExperiments } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        ExperimentSelectors.selectSkipExperiment.setResult(skipExperiments);
        ExperimentSelectors.selectTotalExperiment.setResult(totalExperiments);

        service.isAllExperimentsFetched().subscribe((val) => {
          tick(0);
          expect(val).toBe(expectedValue);
        });
      }));
    });
  });

  describe('#loadExperiments', () => {
    it('should dispatch actionGetExperiments with the given input', () => {
      const fromStarting = true;

      service.loadExperiments(fromStarting);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionGetExperiments({
          fromStarting,
        })
      );
    });

    it('should dispatch actionGetExperiments without the given input', () => {
      service.loadExperiments();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionGetExperiments({
          fromStarting: undefined,
        })
      );
    });
  });

  describe('#createNewExperiment', () => {
    it('should dispatch actionUpsertExperiment with the given input', () => {
      const experiment = { ...mockExperiment };

      service.createNewExperiment(experiment);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionUpsertExperiment({
          experiment,
          actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT,
        })
      );
    });
  });

  describe('#importExperiment', () => {
    it('should dispatch actionUpsertExperiment with the given input', () => {
      const experiment = { ...mockExperiment };

      service.importExperiment([experiment]);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionUpsertExperiment({
          experiment,
          actionType: UpsertExperimentType.CREATE_NEW_EXPERIMENT,
        })
      );
    });
  });

  describe('#updateExperiment', () => {
    it('should dispatch actionUpsertExperiment with the given input', () => {
      const experiment = { ...mockExperiment } as ExperimentVM;
      experiment.stat = {
        id: 'abc123',
        users: 3,
        groups: 3,
        usersExcluded: 3,
        groupsExcluded: 3,
        conditions: [],
      };

      service.updateExperiment(experiment);

      expect(experiment.stat).toBeUndefined();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionUpsertExperiment({
          experiment,
          actionType: UpsertExperimentType.UPDATE_EXPERIMENT,
        })
      );
    });
  });

  describe('#deleteExperiment', () => {
    it('should dispatch actionDeleteExperiment with the given input', () => {
      const experimentId = 'abc123';

      service.deleteExperiment(experimentId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionDeleteExperiment({
          experimentId,
        })
      );
    });
  });

  describe('#selectExperimentById', () => {
    const testCases = [
      {
        whenCondition: 'an experiment is exists at given ID',
        expectedValue: mockExperiment,
        experiment: mockExperiment,
        experimentId: 'abc123',
      },
      {
        whenCondition: 'an experiment is not exists at given ID',
        expectedValue: null,
        experiment: null,
        experimentId: 'abc123',
      },
    ];
    let fetchExperimentByIdSpy: jest.SpyInstance;

    beforeEach(() => {
      fetchExperimentByIdSpy = jest.spyOn(service, 'fetchExperimentById');
    });

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, experiment, experimentId } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        ExperimentSelectors.selectExperimentById.setResult(experiment);

        service.selectExperimentById(experimentId).subscribe((val) => {
          tick(0);

          experiment
            ? expect(fetchExperimentByIdSpy).not.toHaveBeenCalled()
            : expect(fetchExperimentByIdSpy).toHaveBeenCalledWith(experimentId);

          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#fetchExperimentById', () => {
    it('should dispatch actionGetExperimentById with the given input', () => {
      const experimentId = 'abc123';

      service.fetchExperimentById(experimentId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionGetExperimentById({
          experimentId,
        })
      );
    });
  });

  describe('#updateExperimentState', () => {
    it('should dispatch actionUpdateExperimentState with the given input', () => {
      const experimentId = 'abc123';
      const experimentStateInfo = { ...mockExperimentStateInfo };

      service.updateExperimentState(experimentId, experimentStateInfo);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionUpdateExperimentState({
          experimentId,
          experimentStateInfo,
        })
      );
    });
  });

  describe('#fetchContextMetaData', () => {
    it('should dispatch actionUpdateExperimentState with the given input', () => {
      service.fetchContextMetaData();

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchContextMetaData({ isLoadingContextMetaData: true }));
    });
  });

  describe('#setSearchKey', () => {
    it('should set localStorage item and dispatch actionSetSearchKey with the given input', () => {
      const searchKey = mockExperimentSearchKey;

      service.setSearchKey(searchKey);

      expect(mockLocalStorageService.setItem).toHaveBeenCalledWith(
        ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_KEY,
        searchKey
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionSetSearchKey({
          searchKey,
        })
      );
    });
  });

  describe('#setSearchString', () => {
    it('should set localStorage item and dispatch actionSetSearchKey with the given input', () => {
      const searchString = 'test';

      service.setSearchString(searchString);

      expect(mockLocalStorageService.setItem).toHaveBeenCalledWith(
        ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_STRING,
        searchString
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionSetSearchString({
          searchString,
        })
      );
    });
  });

  describe('#setSortKey', () => {
    it('should set localStorage item and dispatch actionSetSortKey with the given input', () => {
      const sortKey = EXPERIMENT_SORT_KEY.CREATED_AT;

      service.setSortKey(sortKey);

      expect(mockLocalStorageService.setItem).toHaveBeenCalledWith(
        ExperimentLocalStorageKeys.EXPERIMENT_SORT_KEY,
        sortKey
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionSetSortKey({
          sortKey,
        })
      );
    });
  });

  describe('#setSortingType', () => {
    it('should set localStorage item and dispatch actionSetSortingType with the given input', () => {
      const sortingType = EXPERIMENT_SORT_AS.ASCENDING;

      service.setSortingType(sortingType);

      expect(mockLocalStorageService.setItem).toHaveBeenCalledWith(
        ExperimentLocalStorageKeys.EXPERIMENT_SORT_TYPE,
        sortingType
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        actionSetSortingType({
          sortingType,
        })
      );
    });
  });

  describe('#fetchAllExperimentNames', () => {
    it('should dispatch actionFetchAllExperimentNames with the given input', () => {
      service.fetchAllExperimentNames();

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchAllExperimentNames());
    });
  });

  describe('#exportExperimentInfo', () => {
    it('should dispatch actionExportExperimentInfo with the given input', () => {
      const experimentId = 'abc123';
      const experimentName = 'test';

      service.exportExperimentInfo(experimentId, experimentName);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionExportExperimentInfo({ experimentId, experimentName }));
    });
  });

  describe('#exportExperimentDesign', () => {
    it('should dispatch actionExportExperimentDesign with the given input', () => {
      const experimentId = 'abc123';

      service.exportExperimentDesign([experimentId]);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionExportExperimentDesign({ experimentIds: [experimentId] }));
    });
  });

  describe('#setGraphRange', () => {
    it('should dispatch actionSetGraphRange with the given input', () => {
      const range = DATE_RANGE.LAST_SEVEN_DAYS;
      const experimentId = 'abc123';
      const clientOffset = 2;

      service.setGraphRange(range, experimentId, clientOffset);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionSetGraphRange({ range, experimentId, clientOffset }));
    });
  });

  describe('#fetchExperimentDetailStat', () => {
    it('should dispatch actionFetchExperimentDetailStat with the given input', () => {
      const experimentId = 'abc123';

      service.fetchExperimentDetailStat(experimentId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(actionFetchExperimentDetailStat({ experimentId }));
    });
  });
});
