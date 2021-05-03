import { TestBed } from '@angular/core/testing';
import { ExperimentLocalStorageKeys, ExperimentState, EXPERIMENT_SORT_AS, EXPERIMENT_SORT_KEY } from '../experiments/store/experiments.model';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStorageService]
    });
    service = TestBed.get(LocalStorageService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get, set, and remove the item', () => {
    service.setItem('TEST', 'item');
    expect(service.getItem('TEST')).toBe('item');
    LocalStorageService.removeItem('TEST');
    expect(service.getItem('TEST')).toBe(null);
  });

  it('should load initial state', () => {
    const experimentState: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      skipExperiment: 0,
      totalExperiments: null,
      searchKey: null,
      searchString: null,
      sortKey: EXPERIMENT_SORT_KEY.STATUS,
      sortAs: EXPERIMENT_SORT_AS.DESCENDING,
      stats: {},
      graphInfo: null,
      graphRange: null,
      isGraphInfoLoading: false,
      allPartitions: null,
      allExperimentNames: null,
      context: [],
      expPointsAndIds: {}
    }
    service.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_KEY, EXPERIMENT_SORT_KEY.STATUS);
    service.setItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_TYPE, EXPERIMENT_SORT_AS.DESCENDING);
    expect(LocalStorageService.loadInitialState()).toEqual({ experiments: experimentState });
  });
});
