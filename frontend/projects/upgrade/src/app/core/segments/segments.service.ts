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
} from './store/segments.selectors';
import { SegmentInput, SegmentLocalStorageKeys, UpsertSegmentType } from './store/segments.model';
import { filter, first, map, tap } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { SegmentsDataService } from './segments.data.service';
import { SEGMENT_SEARCH_KEY, SEGMENT_SORT_AS, SEGMENT_SORT_KEY } from '../../../../../../../types/src/Experiment/enums';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class SegmentsService {
  constructor(
    private store$: Store<AppState>,
    private segmentsDataService: SegmentsDataService,
    private localStorageService: LocalStorageService
  ) {}

  isLoadingSegments$ = this.store$.pipe(select(selectIsLoadingSegments));
  selectedSegment$ = this.store$.pipe(select(selectSelectedSegment));
  selectSearchString$ = this.store$.pipe(select(selectSearchString));
  selectSearchKey$ = this.store$.pipe(select(selectSearchKey));
  selectSegmentSortKey$ = this.store$.pipe(select(selectSortKey));
  selectSegmentSortAs$ = this.store$.pipe(select(selectSortAs));
  allExperimentSegmentsInclusion$ = this.store$.pipe(select(selectExperimentSegmentsInclusion));
  allExperimentSegmentsExclusion$ = this.store$.pipe(select(selectExperimentSegmentsExclusion));

  selectSearchSegmentParams(): Observable<Record<string, unknown>> {
    return combineLatest([this.selectSearchKey$, this.selectSearchString$]).pipe(
      filter(([searchKey, searchString]) => !!searchKey && !!searchString),
      map(([searchKey, searchString]) => ({ searchKey, searchString })),
      first()
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

  setSortingType(sortingType: SEGMENT_SORT_AS) {
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
}
