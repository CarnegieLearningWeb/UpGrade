import { Injectable } from '@angular/core';
import {
  ExperimentLocalStorageKeys,
  ExperimentState,
  EXPERIMENT_SEARCH_KEY,
  EXPERIMENT_SORT_KEY,
} from '../experiments/store/experiments.model';
import { SegmentLocalStorageKeys_LEGACY, SegmentState_LEGACY } from '../segments_LEGACY/store/segments.model._LEGACY';
import { SEGMENT_SEARCH_KEY, SORT_AS_DIRECTION, SEGMENT_SORT_KEY, FLAG_SEARCH_KEY, FLAG_SORT_KEY } from 'upgrade_types';
import { FeatureFlagLocalStorageKeys, FeatureFlagState } from '../feature-flags/store/feature-flags.model';

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

    const featureFlagSortKey = this.getItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SORT_KEY);
    const featureFlagSortType = this.getItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SORT_TYPE);
    const featureFlagSearchKey = this.getItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SEARCH_KEY);
    const featureFlagSearchString = this.getItem(FeatureFlagLocalStorageKeys.FEATURE_FLAG_SEARCH_STRING);

    const segmentSortKey = this.getItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SORT_KEY);
    const segmentSortType = this.getItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SORT_TYPE);
    const segmentSearchKey = this.getItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SEARCH_KEY);
    const segmentSearchString = this.getItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SEARCH_STRING);

    // 1. Populate experiment state
    const experimentState: ExperimentState = {
      ids: [],
      entities: {},
      isLoadingExperiment: false,
      isLoadingExperimentDetailStats: false,
      isPollingExperimentDetailStats: false,
      isLoadingExperimentExport: false,
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

    const featureFlagState: FeatureFlagState = {
      ids: [],
      entities: {},
      isLoadingUpsertFeatureFlag: false,
      isLoadingImportFeatureFlag: false,
      isLoadingSelectedFeatureFlag: false,
      isLoadingFeatureFlags: false,
      isLoadingUpdateFeatureFlagStatus: false,
      isLoadingFeatureFlagDelete: false,
      isLoadingUpsertPrivateSegmentList: false,
      hasInitialFeatureFlagsDataLoaded: false,
      duplicateKeyFound: false,
      activeDetailsTabIndex: 0,
      skipFlags: 0,
      totalFlags: null,
      searchKey: featureFlagSearchKey as FLAG_SEARCH_KEY,
      searchValue: featureFlagSearchString || null,
      sortKey: (featureFlagSortKey as FLAG_SORT_KEY) || FLAG_SORT_KEY.NAME,
      sortAs: (featureFlagSortType as SORT_AS_DIRECTION) || SORT_AS_DIRECTION.ASCENDING,
    };

    const segmentState: SegmentState_LEGACY = {
      ids: [],
      entities: {},
      isLoadingSegments: false,
      allExperimentSegmentsInclusion: null,
      allExperimentSegmentsExclusion: null,
      allFeatureFlagSegmentsInclusion: null,
      allFeatureFlagSegmentsExclusion: null,
      searchKey: segmentSearchKey as SEGMENT_SEARCH_KEY,
      searchString: segmentSearchString || null,
      sortKey: (segmentSortKey as SEGMENT_SORT_KEY) || SEGMENT_SORT_KEY.NAME,
      sortAs: (segmentSortType as SORT_AS_DIRECTION) || SORT_AS_DIRECTION.ASCENDING,
    };

    const state = {
      experiments: experimentState,
      featureFlags: featureFlagState,
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
