import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as SegmentsActions from './store/segments.actions._LEGACY';
import {
  selectIsLoadingSegments_LEGACY,
  selectAllSegments_LEGACY,
  selectSelectedSegment_LEGACY,
  selectExperimentSegmentsInclusion_LEGACY,
  selectExperimentSegmentsExclusion_LEGACY,
  selectFeatureFlagSegmentsInclusion_LEGACY,
  selectFeatureFlagSegmentsExclusion_LEGACY,
  selectSegmentById_LEGACY,
  selectSearchString_LEGACY,
  selectSearchKey_LEGACY,
  selectSortKey_LEGACY,
  selectSortAs_LEGACY,
} from './store/segments.selectors._LEGACY';
import {
  LIST_OPTION_TYPE_LEGACY,
  Segment_LEGACY,
  SegmentInput_LEGACY,
  SegmentLocalStorageKeys_LEGACY,
  UpsertSegmentType_LEGACY,
} from './store/segments.model._LEGACY';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { SegmentsDataService_LEGACY } from './segments.data.service._LEGACY';
import { SEGMENT_SEARCH_KEY, SORT_AS_DIRECTION, SEGMENT_SORT_KEY } from 'upgrade_types';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { selectContextMetaData } from '../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../feature-flags/store/feature-flags.selectors';
import { CommonTextHelpersService } from '../../shared/services/common-text-helpers.service';

@Injectable({ providedIn: 'root' })
export class SegmentsService_LEGACY {
  constructor(
    private store$: Store<AppState>,
    private segmentsDataService: SegmentsDataService_LEGACY,
    private localStorageService: LocalStorageService
  ) {}

  isLoadingSegments$ = this.store$.pipe(select(selectIsLoadingSegments_LEGACY));
  selectAllSegments$ = this.store$.pipe(select(selectAllSegments_LEGACY));
  selectedSegment$ = this.store$.pipe(select(selectSelectedSegment_LEGACY));
  selectSearchString$ = this.store$.pipe(select(selectSearchString_LEGACY));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey_LEGACY));
  selectSegmentSortKey$ = this.store$.pipe(select(selectSortKey_LEGACY));
  selectSegmentSortAs$ = this.store$.pipe(select(selectSortAs_LEGACY));
  allExperimentSegmentsInclusion$ = this.store$.pipe(select(selectExperimentSegmentsInclusion_LEGACY));
  allExperimentSegmentsExclusion$ = this.store$.pipe(select(selectExperimentSegmentsExclusion_LEGACY));
  allFeatureFlagSegmentsExclusion$ = this.store$.pipe(select(selectFeatureFlagSegmentsExclusion_LEGACY));
  allFeatureFlagSegmentsInclusion$ = this.store$.pipe(select(selectFeatureFlagSegmentsInclusion_LEGACY));

  selectSearchSegmentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString }))
    );
  }

  selectSegmentById(segmentId: string) {
    return this.store$.pipe(
      select(selectSegmentById_LEGACY, { segmentId }),
      tap((segment) => {
        if (!segment) {
          this.fetchSegmentById(segmentId);
        }
      }),
      map((segment) => ({ ...segment }))
    );
  }

  allSegments$ = this.store$.pipe(
    select(selectAllSegments_LEGACY),
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
          value: LIST_OPTION_TYPE_LEGACY.SEGMENT,
          viewValue: LIST_OPTION_TYPE_LEGACY.SEGMENT,
        },
        {
          value: LIST_OPTION_TYPE_LEGACY.INDIVIDUAL,
          viewValue: LIST_OPTION_TYPE_LEGACY.INDIVIDUAL,
        },
        ...groupTypeSelectOptions,
      ];

      return listOptionTypes;
    })
  );

  selectSegmentsByContext(appContext: string): Observable<Segment_LEGACY[]> {
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
    this.store$.dispatch(SegmentsActions.actionGetSegmentById_LEGACY({ segmentId }));
  }

  isInitialSegmentsLoading() {
    return combineLatest(this.store$.pipe(select(selectIsLoadingSegments_LEGACY)), this.allSegments$).pipe(
      map(([isLoading, segments]) => !isLoading || !!segments.length)
    );
  }

  fetchSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchSegments_LEGACY({ fromStarting }));
  }

  createNewSegment(segment: SegmentInput_LEGACY) {
    this.store$.dispatch(
      SegmentsActions.actionUpsertSegment_LEGACY({ segment, actionType: UpsertSegmentType_LEGACY.CREATE_NEW_SEGMENT })
    );
  }

  setSearchKey(searchKey: SEGMENT_SEARCH_KEY) {
    this.localStorageService.setItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SEARCH_KEY, searchKey);
    this.store$.dispatch(SegmentsActions.actionSetSearchKey_LEGACY({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.localStorageService.setItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SEARCH_STRING, searchString);
    this.store$.dispatch(SegmentsActions.actionSetSearchString_LEGACY({ searchString }));
  }

  setSortKey(sortKey: SEGMENT_SORT_KEY) {
    this.localStorageService.setItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SORT_KEY, sortKey);
    this.store$.dispatch(SegmentsActions.actionSetSortKey_LEGACY({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS_DIRECTION) {
    this.localStorageService.setItem(SegmentLocalStorageKeys_LEGACY.SEGMENT_SORT_TYPE, sortingType);
    this.store$.dispatch(SegmentsActions.actionSetSortingType_LEGACY({ sortingType }));
  }

  deleteSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionDeleteSegment_LEGACY({ segmentId }));
  }

  updateSegment(segment: SegmentInput_LEGACY) {
    this.store$.dispatch(
      SegmentsActions.actionUpsertSegment_LEGACY({ segment, actionType: UpsertSegmentType_LEGACY.UPDATE_SEGMENT })
    );
  }

  exportSegments(segmentIds: string[]) {
    this.store$.dispatch(SegmentsActions.actionExportSegments_LEGACY({ segmentIds }));
  }

  exportSegmentCSV(segmentIds: string[]): Observable<any> {
    return this.segmentsDataService.exportSegmentCSV(segmentIds);
  }
}
