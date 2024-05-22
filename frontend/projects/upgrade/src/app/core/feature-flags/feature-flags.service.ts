import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlagsSortedByDate,
  selectIsAllFlagsFetched,
  selectIsLoadingFeatureFlags,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { FEATURE_FLAG_STATUS, FILTER_MODE, FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>) {}

  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));

    // mock response
    setTimeout(() => {
      this.store$.dispatch(
        FeatureFlagsActions.actionFetchFeatureFlagsSuccess({
          flags: mockFeatureFlags,
          totalFlags: 1,
        })
      );
    }, 3000);
  }

  setSearchKey(searchKey: FLAG_SEARCH_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: FLAG_SORT_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSortingType({ sortingType }));
  }

  //**** mocks
}

const mockFeatureFlags = [
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '1',
    name: 'Feature Flag 1',
    key: 'feature_flag_1',
    description: 'Feature Flag 1 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context1', 'context2'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
  {
    createdAt: '2021-09-08T08:00:00.000Z',
    updatedAt: '2021-09-08T08:00:00.000Z',
    versionNumber: 1,
    id: '1',
    name: 'Feature Flag 2',
    key: 'feature_flag_2',
    description: 'Feature Flag 2 Description',
    status: FEATURE_FLAG_STATUS.ENABLED,
    filterMode: FILTER_MODE.INCLUDE_ALL,
    context: ['context1', 'context2'],
    tags: ['tag1', 'tag2'],
    featureFlagSegmentInclusion: null,
    featureFlagSegmentExclusion: null,
  },
];
