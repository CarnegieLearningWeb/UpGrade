import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import {
  selectAllFeatureFlagsSortedByDate,
  selectIsAllFlagsFetched,
  selectIsLoadingFeatureFlags,
  selectHasInitialFeatureFlagsDataLoaded,
  selectSearchKey,
  selectSearchString,
  selectIsLoadingUpsertFeatureFlag,
  selectActiveDetailsTabIndex,
  selectIsLoadingUpdateFeatureFlagStatus,
  selectSelectedFeatureFlag,
  selectSearchFeatureFlagParams,
  selectRootTableState,
  selectFeatureFlagOverviewDetails,
  selectIsLoadingFeatureFlagDelete,
  selectFeatureFlagInclusions,
  selectFeatureFlagExclusions,
  selectIsLoadingSelectedFeatureFlag,
  selectSortKey,
  selectSortAs,
} from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';
import { FLAG_SEARCH_KEY, FLAG_SORT_KEY, SORT_AS_DIRECTION } from 'upgrade_types';
import {
  AddFeatureFlagRequest,
  FeatureFlag,
  LIST_OPTION_TYPE,
  UpdateFeatureFlagStatusRequest,
} from './store/feature-flags.model';
import { ExperimentService } from '../experiments/experiments.service';
import { filter, map, pairwise, withLatestFrom } from 'rxjs';
import { selectContextMetaData } from '../experiments/store/experiments.selectors';

@Injectable()
export class FeatureFlagsService {
  constructor(private store$: Store<AppState>, private experimentService: ExperimentService) {}

  isInitialFeatureFlagsLoading$ = this.store$.pipe(select(selectHasInitialFeatureFlagsDataLoaded));
  isLoadingFeatureFlags$ = this.store$.pipe(select(selectIsLoadingFeatureFlags));
  isLoadingSelectedFeatureFlag$ = this.store$.pipe(select(selectIsLoadingSelectedFeatureFlag));
  isLoadingUpsertFeatureFlag$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlag));
  IsLoadingFeatureFlagDelete$ = this.store$.pipe(select(selectIsLoadingFeatureFlagDelete));
  isLoadingUpdateFeatureFlagStatus$ = this.store$.pipe(select(selectIsLoadingUpdateFeatureFlagStatus));
  allFeatureFlags$ = this.store$.pipe(select(selectAllFeatureFlagsSortedByDate));
  isAllFlagsFetched$ = this.store$.pipe(select(selectIsAllFlagsFetched));
  searchString$ = this.store$.pipe(select(selectSearchString));
  searchKey$ = this.store$.pipe(select(selectSearchKey));
  sortKey$ = this.store$.pipe(select(selectSortKey));
  sortAs$ = this.store$.pipe(select(selectSortAs));

  featureFlagsListLengthChange$ = this.allFeatureFlags$.pipe(
    pairwise(),
    filter(([prevEntities, currEntities]) => prevEntities.length !== currEntities.length)
  );
  selectedFeatureFlagStatusChange$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev.status !== curr.status)
  );
  // Observable to check if selectedFeatureFlag is removed from the store
  isSelectedFeatureFlagRemoved$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev && !curr)
  );

  isSelectedFeatureFlagUpdated$ = this.store$.pipe(
    select(selectSelectedFeatureFlag),
    pairwise(),
    filter(([prev, curr]) => prev && curr && JSON.stringify(prev) !== JSON.stringify(curr)),
    map(([prev, curr]) => curr)
  );

  selectedFlagOverviewDetails = this.store$.pipe(select(selectFeatureFlagOverviewDetails));
  selectedFeatureFlag$ = this.store$.pipe(select(selectSelectedFeatureFlag));
  searchParams$ = this.store$.pipe(select(selectSearchFeatureFlagParams));
  selectRootTableState$ = this.store$.select(selectRootTableState);
  activeDetailsTabIndex$ = this.store$.pipe(select(selectActiveDetailsTabIndex));
  appContexts$ = this.experimentService.contextMetaData$.pipe(
    map((contextMetaData) => {
      return Object.keys(contextMetaData?.contextMetadata ?? []);
    })
  );
  selectFeatureFlagInclusions$ = this.store$.pipe(select(selectFeatureFlagInclusions));
  selectFeatureFlagInclusionsLength$ = this.store$.pipe(
    select(selectFeatureFlagInclusions),
    map((inclusions) => inclusions.length)
  );
  selectFeatureFlagExclusions$ = this.store$.pipe(select(selectFeatureFlagExclusions));
  selectFeatureFlagExclusionsLength$ = this.store$.pipe(
    select(selectFeatureFlagExclusions),
    map((exclusions) => exclusions.length)
  );
  // note: this comes from experiment service!
  selectFeatureFlagListTypeOptions$ = this.store$.pipe(
    select(selectContextMetaData),
    withLatestFrom(this.store$.pipe(select(selectSelectedFeatureFlag))),
    map(([contextMetaData, flag]) => {
      // TODO: straighten out contextmetadata and it's selectors with a dedicated service
      const flagAppContext = flag?.context?.[0];
      const groupTypes = contextMetaData?.contextMetadata?.[flagAppContext]?.GROUP_TYPES ?? [];
      const groupTypeSelectOptions = this.formatGroupTypes(groupTypes as string[]);
      const listOptionTypes = [
        {
          value: LIST_OPTION_TYPE.SEGMENT,
          viewValue: LIST_OPTION_TYPE.SEGMENT,
        },
        {
          value: LIST_OPTION_TYPE.INDIVIDUAL,
          viewValue: LIST_OPTION_TYPE.INDIVIDUAL,
        },
        ...groupTypeSelectOptions,
      ];

      return listOptionTypes;
    })
  );

  formatGroupTypes(groupTypes: string[]): { value: string; viewValue: string }[] {
    if (Array.isArray(groupTypes) && groupTypes.length > 0) {
      return groupTypes.map((groupType) => {
        return { value: groupType, viewValue: 'Group: "' + groupType + '"' };
      });
    } else {
      return [];
    }
  }

  convertNameStringToKey(name: string): string {
    const upperCaseString = name.trim().toUpperCase();
    const key = upperCaseString.replace(/ /g, '_');
    return key;
  }

  fetchFeatureFlags(fromStarting?: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
  }

  fetchFeatureFlagById(featureFlagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlagById({ featureFlagId }));
  }

  fetchContextMetaData() {
    this.store$.dispatch(actionFetchContextMetaData({ isLoadingContextMetaData: true }));
  }

  addFeatureFlag(addFeatureFlagRequest: AddFeatureFlagRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionAddFeatureFlag({ addFeatureFlagRequest }));
  }

  updateFeatureFlag(flag: FeatureFlag) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlag({ flag }));
  }

  updateFeatureFlagStatus(updateFeatureFlagStatusRequest: UpdateFeatureFlagStatusRequest) {
    this.store$.dispatch(FeatureFlagsActions.actionUpdateFeatureFlagStatus({ updateFeatureFlagStatusRequest }));
  }

  deleteFeatureFlag(flagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
  }

  emailFeatureFlagData(featureFlagId: string) {
    this.store$.dispatch(FeatureFlagsActions.actionEmailFeatureFlagData({ featureFlagId }));
  }

  exportFeatureFlagsData(featureFlagIds: string[]) {
    this.store$.dispatch(FeatureFlagsActions.actionExportFeatureFlagDesign({ featureFlagIds }));
  }

  setSearchKey(searchKey: FLAG_SEARCH_KEY) {
    this.store$.dispatch(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
  }

  setExportFeatureFlagsSuccessFlag(flag: boolean) {
    this.store$.dispatch(FeatureFlagsActions.actionSetExportFeatureFlagsSuccessFlag({ flag }));
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

  setActiveDetailsTab(activeDetailsTabIndex: number) {
    this.store$.dispatch(FeatureFlagsActions.actionSetActiveDetailsTabIndex({ activeDetailsTabIndex }));
  }
}
