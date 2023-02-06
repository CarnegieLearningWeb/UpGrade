import {
  ExperimentState,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY,
} from '../experiments/store/experiments.model';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
  });

  afterEach(() => {
    window.localStorage.__proto__.setItem = jest.fn().mockRestore();
    window.localStorage.__proto__.getItem = jest.fn().mockRestore();
    window.localStorage.__proto__.removeItem = jest.fn().mockRestore();
  });

  describe('#loadInitialState', () => {
    const expectedStateWithFetchedValues: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      isLoadingExperimentDetailStats: false,
      isPollingExperimentDetailStats: false,
      skipExperiment: 0,
      totalExperiments: null,
      searchKey: EXPERIMENT_SEARCH_KEY.ALL,
      searchString: 'test',
      sortKey: EXPERIMENT_SORT_KEY.STATUS,
      sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      stats: {},
      graphInfo: null,
      graphRange: null,
      isGraphInfoLoading: false,
      allDecisionPoints: null,
      allExperimentNames: null,
      contextMetaData: {
        contextMetadata: {},
      },
      isLoadingContextMetaData: false,
      currentUserSelectedContext: null,
    };
    const expectedStateWithDefaults: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      isLoadingExperimentDetailStats: false,
      isPollingExperimentDetailStats: false,
      skipExperiment: 0,
      totalExperiments: null,
      searchKey: null,
      searchString: null,
      sortKey: EXPERIMENT_SORT_KEY.NAME,
      sortAs: EXPERIMENT_SORT_AS.ASCENDING,
      stats: {},
      graphInfo: null,
      graphRange: null,
      isGraphInfoLoading: false,
      allDecisionPoints: null,
      allExperimentNames: null,
      contextMetaData: {
        contextMetadata: {},
      },
      isLoadingContextMetaData: false,
      currentUserSelectedContext: null,
    };

    const testCases = [
      {
        whenCondition: 'when data in local storage, THEN experiment should use those values',
        expectedValue: expectedStateWithFetchedValues,
        fetchedSortKey: EXPERIMENT_SORT_KEY.STATUS,
        fetchedSortAs: EXPERIMENT_SORT_AS.ASCENDING,
        fetchedSearchKey: EXPERIMENT_SEARCH_KEY.ALL,
        fetchedSearchString: 'test',
      },
      {
        whenCondition: 'nothing in local storage, THEN use defaults',
        expectedValue: expectedStateWithDefaults,
        fetchedSortKey: null,
        fetchedSortAs: null,
        fetchedSearchKey: null,
        fetchedSearchString: null,
      },
    ];

    testCases.forEach(
      ({ whenCondition, expectedValue, fetchedSearchKey, fetchedSearchString, fetchedSortAs, fetchedSortKey }) => {
        it(`WHEN ${whenCondition}:`, () => {
          service.getItem = jest
            .fn()
            .mockReturnValueOnce(fetchedSortKey)
            .mockReturnValueOnce(fetchedSortAs)
            .mockReturnValueOnce(fetchedSearchKey)
            .mockReturnValueOnce(fetchedSearchString);

          const { experiments } = service.loadInitialState();

          expect(experiments).toEqual(expectedValue);
        });
      }
    );
  });

  describe('#setItem', () => {
    const testCases = [
      {
        key: 'testString',
        value: 'testString',
      },
      {
        key: 'testObject',
        value: {
          thing: 'test',
        },
      },
      {
        key: 'testNull',
        value: null,
      },
      {
        key: 'testUndefined',
        value: undefined,
      },
    ];

    testCases.forEach(({ key, value }) => {
      it('should call setItem on localstorage object', () => {
        const expectedKey = `UPGRADE-${key}`;
        const expectedValue = JSON.stringify(value);
        window.localStorage.__proto__.setItem = jest.fn();

        service.setItem(key, value);

        expect(localStorage.setItem).toHaveBeenCalledWith(expectedKey, expectedValue);
      });
    });
  });

  describe('#getItem', () => {
    const testCases = [
      {
        key: 'testString',
        value: 'testString',
        storedValue: JSON.stringify('testString'),
      },
      {
        key: 'testObject',
        value: {
          thing: 'test',
        },
        storedValue: JSON.stringify({
          thing: 'test',
        }),
      },
      {
        key: 'testNull',
        value: null,
        storedValue: null,
      },
    ];

    testCases.forEach(({ key, value, storedValue }) => {
      it(`should call getItem on localstorage object and JSON.parse on ${storedValue}`, () => {
        const expectedLookupKey = `UPGRADE-${key}`;
        window.localStorage.__proto__.getItem = jest.fn().mockReturnValue(storedValue);

        const actualValue = service.getItem(key);

        expect(localStorage.getItem).toHaveBeenCalledWith(expectedLookupKey);
        expect(actualValue).toEqual(value);
      });
    });
  });

  describe('#removeItem', () => {
    it('should call local storage remove item method with prefixed key', () => {
      const key = 'test';
      const expectedLookupKey = `UPGRADE-${key}`;
      window.localStorage.__proto__.removeItem = jest.fn();

      service.removeItem(key);

      expect(localStorage.removeItem).toHaveBeenCalledWith(expectedLookupKey);
    });
  });
});
