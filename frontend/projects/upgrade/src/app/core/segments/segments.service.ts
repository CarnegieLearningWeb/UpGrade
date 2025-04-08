import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as SegmentsActions from './store/segments.actions';
import {
  selectIsLoadingSegments,
  selectAllSegments,
  selectSelectedSegment,
  selectRootTableState,
  selectSegmentOverviewDetails,
  selectExperimentSegmentsInclusion,
  selectExperimentSegmentsExclusion,
  selectFeatureFlagSegmentsInclusion,
  selectFeatureFlagSegmentsExclusion,
  selectSearchString,
  selectSearchKey,
  selectSortKey,
  selectSortAs,
  selectSegmentLists,
  selectAppContexts,
  selectSegmentUsageData,
  selectIsLoadingGlobalSegments,
  selectGlobalTableState,
  selectGlobalSortKey,
  selectGlobalSortAs,
  isLoadingUpsertSegment,
  selectSegmentIdAfterNavigation,
} from './store/segments.selectors';
import {
  AddSegmentRequest,
  LIST_OPTION_TYPE,
  Segment,
  SegmentInput,
  SegmentLocalStorageKeys,
  UpdateSegmentRequest,
  UpsertSegmentType,
} from './store/segments.model';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { SegmentsDataService } from './segments.data.service';
import { SEGMENT_SEARCH_KEY, SORT_AS_DIRECTION, SEGMENT_SORT_KEY, DuplicateSegmentNameError } from 'upgrade_types';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { selectShouldUseLegacyUI } from './store/segments.selectors';
import { selectContextMetaData } from '../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../feature-flags/store/feature-flags.selectors';
import { CommonTextHelpersService } from '../../shared/services/common-text-helpers.service';
import { actionFetchContextMetaData } from '../experiments/store/experiments.actions';

@Injectable({ providedIn: 'root' })
export class SegmentsService {
  constructor(
    private store$: Store<AppState>,
    private segmentsDataService: SegmentsDataService,
    private localStorageService: LocalStorageService
  ) {}

  isLoadingSegments$ = this.store$.pipe(select(selectIsLoadingSegments));
  isLoadingUpsertSegment$ = this.store$.pipe(select(isLoadingUpsertSegment));
  setIsLoadingImportSegment$ = this.store$.pipe(select(selectIsLoadingSegments));
  isLoadingGlobalSegments$ = this.store$.pipe(select(selectIsLoadingGlobalSegments));
  selectAllSegments$ = this.store$.pipe(select(selectAllSegments));
  selectedSegment$ = this.store$.pipe(select(selectSelectedSegment));
  selectRootTableState$ = this.store$.pipe(select(selectRootTableState));
  selectGlobalTableState$ = this.store$.pipe(select(selectGlobalTableState));
  shouldUseLegacyView$ = this.store$.pipe(select(selectShouldUseLegacyUI));
  selectedSegmentOverviewDetails = this.store$.pipe(select(selectSegmentOverviewDetails));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectSegmentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectSegmentSortAs$ = this.store$.pipe(select(selectSortAs));
  selectGlobalSegmentSortKey$ = this.store$.pipe(select(selectGlobalSortKey));
  selectGlobalSegmentSortAs$ = this.store$.pipe(select(selectGlobalSortAs));
  selectSegmentLists$ = this.store$.pipe(select(selectSegmentLists));
  selectSegmentListsLength$ = this.store$.pipe(
    select(selectSegmentLists),
    map((lists) => lists.length)
  );
  appContexts$ = this.store$.pipe(select(selectAppContexts));
  allExperimentSegmentsInclusion$ = this.store$.pipe(select(selectExperimentSegmentsInclusion));
  allExperimentSegmentsExclusion$ = this.store$.pipe(select(selectExperimentSegmentsExclusion));
  allFeatureFlagSegmentsExclusion$ = this.store$.pipe(select(selectFeatureFlagSegmentsExclusion));
  allFeatureFlagSegmentsInclusion$ = this.store$.pipe(select(selectFeatureFlagSegmentsInclusion));
  segmentUsageData$ = this.store$.pipe(select(selectSegmentUsageData));
  duplicateSegmentNameError$ = new BehaviorSubject<DuplicateSegmentNameError>(null);
  selectSegmentIdAfterNavigation$ = this.store$.pipe(select(selectSegmentIdAfterNavigation));

  selectSearchSegmentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString }))
    );
  }

  allSegments$ = this.store$.pipe(
    select(selectAllSegments),
    filter((allSegments) => !!allSegments),
    map((Segments) =>
      Segments.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );

  selectPrivateSegmentListTypeOptions$ = this.store$.pipe(
    select(selectContextMetaData),
    withLatestFrom(this.store$.pipe(select(selectSelectedFeatureFlag))),
    map(([contextMetaData, flag]) => {
      // TODO: straighten out contextmetadata and it's selectors with a dedicated service to avoid this sweaty effort to get standard information
      const flagAppContext = flag?.context?.[0];
      const groupTypes = contextMetaData?.contextMetadata?.[flagAppContext]?.GROUP_TYPES ?? [];
      const groupTypeSelectOptions = CommonTextHelpersService.formatGroupTypes(groupTypes as string[]);
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

  selectSegmentsByContext(appContext: string): Observable<Segment[]> {
    return this.selectAllSegments$.pipe(
      map((segments) => {
        const filteredSegments = segments.filter((segment) => {
          return segment.context === appContext;
        });
        return filteredSegments;
      })
    );
  }

  fetchSegmentById(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionGetSegmentById({ segmentId }));
  }

  fetchContextMetaData() {
    this.store$.dispatch(actionFetchContextMetaData({ isLoadingContextMetaData: true }));
  }

  isInitialSegmentsLoading() {
    return combineLatest(this.store$.pipe(select(selectIsLoadingSegments)), this.allSegments$).pipe(
      map(([isLoading, segments]) => !isLoading || !!segments.length)
    );
  }

  fetchSegmentsPaginated(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting }));
  }

  fetchGlobalSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchGlobalSegments({ fromStarting }));
  }

  fetchAllSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionfetchAllSegments({ fromStarting }));
  }

  createNewSegment(segment: SegmentInput) {
    this.store$.dispatch(
      SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.CREATE_NEW_SEGMENT })
    );
  }

  setSearchKey(searchKey: SEGMENT_SEARCH_KEY) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SEARCH_KEY, searchKey);
    this.store$.dispatch(SegmentsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SEARCH_STRING, searchString);
    this.store$.dispatch(SegmentsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: SEGMENT_SORT_KEY) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SORT_KEY, sortKey);
    this.store$.dispatch(SegmentsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SORT_TYPE, sortingType);
    this.store$.dispatch(SegmentsActions.actionSetSortingType({ sortingType }));
  }

  setIsLoadingImportSegment(isLoadingSegments: boolean) {
    this.store$.dispatch(SegmentsActions.actionSetIsLoadingSegments({ isLoadingSegments })); //fix!
  }

  setGlobalSortKey(sortKey: SEGMENT_SORT_KEY) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SORT_KEY, sortKey);
    this.store$.dispatch(SegmentsActions.actionSetGlobalSortKey({ sortKey }));
  }

  setGlobalSortingType(sortingType: SORT_AS_DIRECTION) {
    this.localStorageService.setItem(SegmentLocalStorageKeys.SEGMENT_SORT_TYPE, sortingType);
    this.store$.dispatch(SegmentsActions.actionSetGlobalSortingType({ sortingType }));
  }

  deleteSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionDeleteSegment({ segmentId }));
  }

  updateSegment(segment: SegmentInput) {
    this.store$.dispatch(
      SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.UPDATE_SEGMENT })
    );
  }

  addSegment(addSegmentRequest: AddSegmentRequest) {
    this.store$.dispatch(SegmentsActions.actionAddSegment({ addSegmentRequest }));
  }

  modifySegment(updateSegmentRequest: UpdateSegmentRequest) {
    this.store$.dispatch(SegmentsActions.actionUpdateSegment({ updateSegmentRequest }));
  }

  exportSegments(segmentIds: string[]) {
    this.store$.dispatch(SegmentsActions.actionExportSegments({ segmentIds }));
  }

  exportSegmentCSV(segmentIds: string[]): Observable<any> {
    return this.segmentsDataService.exportSegmentCSV(segmentIds);
  }

  setDuplicateSegmentNameError(error: DuplicateSegmentNameError) {
    this.duplicateSegmentNameError$.next(error);
  }
}
