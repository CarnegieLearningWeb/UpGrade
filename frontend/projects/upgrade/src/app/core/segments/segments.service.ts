import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as SegmentsActions from './store/segments.actions';
import {
  selectIsLoadingSegments,
  selectAllSegments,
  selectSelectedSegment,
  selectExperimentSegmentsInclusion,
  selectExperimentSegmentsExclusion,
  selectSegmentById,
  selectSearchString,
  selectSearchKey,
  selectSortKey,
  selectSortAs,
  selectIsLoadingUpsertFeatureFlagList,
} from './store/segments.selectors';
import {
  LIST_OPTION_TYPE,
  Segment,
  SegmentInput,
  SegmentLocalStorageKeys,
  UpsertSegmentType,
} from './store/segments.model';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { SegmentsDataService } from './segments.data.service';
import { SEGMENT_SEARCH_KEY, SORT_AS_DIRECTION, SEGMENT_SORT_KEY } from 'upgrade_types';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { selectContextMetaData } from '../experiments/store/experiments.selectors';
import { selectSelectedFeatureFlag } from '../feature-flags/store/feature-flags.selectors';
import { CommonTextHelpersService } from '../../shared/services/common-text-helpers.service';

@Injectable({ providedIn: 'root' })
export class SegmentsService {
  constructor(
    private store$: Store<AppState>,
    private segmentsDataService: SegmentsDataService,
    private localStorageService: LocalStorageService
  ) {}

  isLoadingSegments$ = this.store$.pipe(select(selectIsLoadingSegments));
  selectAllSegments$ = this.store$.pipe(select(selectAllSegments));
  selectedSegment$ = this.store$.pipe(select(selectSelectedSegment));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectSegmentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectSegmentSortAs$ = this.store$.pipe(select(selectSortAs));
  allExperimentSegmentsInclusion$ = this.store$.pipe(select(selectExperimentSegmentsInclusion));
  allExperimentSegmentsExclusion$ = this.store$.pipe(select(selectExperimentSegmentsExclusion));
  select;
  isLoadingUpsertFeatureFlagList$ = this.store$.pipe(select(selectIsLoadingUpsertFeatureFlagList));

  selectSearchSegmentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString }))
    );
  }

  selectSegmentById(segmentId: string) {
    return this.store$.pipe(
      select(selectSegmentById, { segmentId }),
      tap((segment) => {
        if (!segment) {
          this.fetchSegmentById(segmentId);
        }
      }),
      map((segment) => ({ ...segment }))
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

  // note: this comes from experiment service!
  selectPrivateSegmentListTypeOptions$ = this.store$.pipe(
    select(selectContextMetaData),
    withLatestFrom(this.store$.pipe(select(selectSelectedFeatureFlag))),
    map(([contextMetaData, flag]) => {
      // TODO: straighten out contextmetadata and it's selectors with a dedicated service
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

  getSegmentsByContext(appContext: string): Observable<Segment[]> {
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

  isInitialSegmentsLoading() {
    return combineLatest(this.store$.pipe(select(selectIsLoadingSegments)), this.allSegments$).pipe(
      map(([isLoading, segments]) => !isLoading || !!segments.length)
    );
  }

  fetchSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting }));
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

  deleteSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionDeleteSegment({ segmentId }));
  }

  updateSegment(segment: SegmentInput) {
    this.store$.dispatch(
      SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.UPDATE_SEGMENT })
    );
  }

  exportSegments(segmentIds: string[]) {
    this.store$.dispatch(SegmentsActions.actionExportSegments({ segmentIds }));
  }

  exportSegmentCSV(segmentIds: string[]): Observable<any> {
    return this.segmentsDataService.exportSegmentCSV(segmentIds);
  }

  upsertPrivateSegmentList(list: any) {
    this.store$.dispatch(SegmentsActions.actionAddFeatureFlagInclusionList({ list }));
  }
}
