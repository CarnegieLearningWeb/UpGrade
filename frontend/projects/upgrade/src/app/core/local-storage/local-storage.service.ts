import { Injectable } from '@angular/core';
import {
  ExperimentLocalStorageKeys,
  ExperimentState,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
} from '../experiments/store/experiments.model';
import { SegmentLocalStorageKeys, SegmentState } from '../segments/store/segments.model';
import { SEGMENT_SEARCH_KEY, SORT_AS_DIRECTION, SEGMENT_SORT_KEY } from 'upgrade_types';

const APP_PREFIX = 'UPGRADE-';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  loadInitialState() {
    const experimentSortKey = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_KEY);
    const experimentSortType = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SORT_TYPE);
    const experimentSearchKey = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_KEY);
    const experimentSearchString = this.getItem(ExperimentLocalStorageKeys.EXPERIMENT_SEARCH_STRING);

    const segmentSortKey = this.getItem(SegmentLocalStorageKeys.SEGMENT_SORT_KEY);
    const segmentSortType = this.getItem(SegmentLocalStorageKeys.SEGMENT_SORT_TYPE);
    const segmentSearchKey = this.getItem(SegmentLocalStorageKeys.SEGMENT_SEARCH_KEY);
    const segmentSearchString = this.getItem(SegmentLocalStorageKeys.SEGMENT_SEARCH_STRING);

    // 1. Populate experiment state
    const experimentState: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      isLoadingExperimentDetailStats: false,
      isPollingExperimentDetailStats: false,
      skipExperiment: 0,
      totalExperiments: null,
      searchKey: experimentSearchKey as EXPERIMENT_SEARCH_KEY,
      searchString: experimentSearchString || null,
      sortKey: (experimentSortKey as EXPERIMENT_SORT_KEY) || EXPERIMENT_SORT_KEY.NAME,
      sortAs: (experimentSortType as SORT_AS_DIRECTION) || SORT_AS_DIRECTION.ASCENDING,
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

    const segmentState: SegmentState = {
      ids: [],
      entities: {},
      isLoadingSegments: false,
      isLoadingUpsertPrivateSegmentList: false,
      allExperimentSegmentsInclusion: null,
      allExperimentSegmentsExclusion: null,
      searchKey: segmentSearchKey as SEGMENT_SEARCH_KEY,
      searchString: segmentSearchString || null,
      sortKey: (segmentSortKey as SEGMENT_SORT_KEY) || SEGMENT_SORT_KEY.NAME,
      sortAs: (segmentSortType as SORT_AS_DIRECTION) || SORT_AS_DIRECTION.ASCENDING,
    };

    const state = {
      experiments: experimentState, // experiment state,
      segments: segmentState,
    };
    return state;
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
  }

  getItem(key: string) {
    return JSON.parse(localStorage.getItem(`${APP_PREFIX}${key}`));
  }

  removeItem(key: string) {
    localStorage.removeItem(`${APP_PREFIX}${key}`);
  }
}
