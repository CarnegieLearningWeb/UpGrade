import { Injectable } from '@angular/core';
import {
  ExperimentLocalStorageKeys,
  ExperimentState,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_AS,
  EXPERIMENT_SORT_KEY} from '../experiments/store/experiments.model';

const APP_PREFIX = 'UPGRADE-';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  constructor() {}

  static loadInitialState() {
    const experimentSortKey = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_KEY);
    const experimentSortType = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_TYPE);
    const experimentSearchKey = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_KEY);
    const experimentSearchString = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_STRING);

    // 1. Populate experiment state
    const experimentState: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      skipExperiment: 0,
      totalExperiments: null,
      searchKey: (experimentSearchKey as EXPERIMENT_SEARCH_KEY),
      searchString: experimentSearchString || null,
      sortKey: (experimentSortKey as EXPERIMENT_SORT_KEY) || EXPERIMENT_SORT_KEY.NAME,
      sortAs: (experimentSortType as EXPERIMENT_SORT_AS) || EXPERIMENT_SORT_AS.ASCENDING,
      stats: {},
      graphInfo: null,
      graphRange: null,
      isGraphInfoLoading: false,
      allPartitions: null,
      allExperimentNames: null,
      contextMetaData: {}
    };

    const state = {
      experiments: experimentState // experiment state,
    };
    return state;
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
  }

  getItem(key: string) {
    return JSON.parse(localStorage.getItem(`${APP_PREFIX}${key}`));
  }

  static getItem(key: string) {
    return JSON.parse(localStorage.getItem(`${APP_PREFIX}${key}`));
  }

  static removeItem(key: string) {
    localStorage.removeItem(`${APP_PREFIX}${key}`);
  }

  clear() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(APP_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}
