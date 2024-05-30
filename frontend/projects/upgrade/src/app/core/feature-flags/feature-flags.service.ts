import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlagsSortedByDate,
  selectIsAllFlagsFetched,
  selectIsLoadingFeatureFlags,
  selectHasInitialFeatureFlagsDataLoaded,
  selectIsLoadingAddFeatureFlag,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import {
  FEATURE_FLAG_STATUS,
  FILTER_MODE,
  FLAG_SEARCH_KEY,
  FLAG_SORT_KEY,
  SEGMENT_TYPE,
  SORT_AS_DIRECTION,
} from 'upgrade_types';
import { FeatureFlagFormData } from '../../features/dashboard/feature-flags/modals/add-feature-flag-modal/add-feature-flag-modal.component';
import { AddFeatureFlagRequest, FeatureFlag } from './store/feature-flags.model';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>) {}
  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingAddFeatureFlag$ = this.store$.pipe(select(selectIsLoadingAddFeatureFlag));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
  }

  addFeatureFlag(featureFlagFormData: any) {
    const featureFlagDTO = this.createAddFeatureFlagRequest({
      ...featureFlagFormData,
      tags: featureFlagFormData.tags.split(','),
    });
    this.store$.dispatch(FeatureFlagsActions.actionCreateFeatureFlag({ addFeatureFlagRequest: featureFlagDTO }));
  }

  createAddFeatureFlagRequest(featureFlagFormData: FeatureFlagFormData): AddFeatureFlagRequest {
    const { name, key, description, appContext, tags } = featureFlagFormData;
    const createFeatureFlagDTO: AddFeatureFlagRequest = {
      name,
      key,
      description,
      status: FEATURE_FLAG_STATUS.DISABLED,
      context: [appContext],
      tags: tags,
      featureFlagSegmentInclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      featureFlagSegmentExclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      filterMode: FILTER_MODE.INCLUDE_ALL,
    };

    console.log('createFeatureFlagDTO', createFeatureFlagDTO);
    return createFeatureFlagDTO;
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
}
