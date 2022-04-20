import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as SegmentsActions from './store/segments.actions';
import { selectIsLoadingSegments, selectAllSegments, selectSelectedSegment, selectTotalSegments, selectSkipSegments } from './store/segments.selectors';
import { Segment, UpsertSegmentType, SEGMENTS_SEARCH_SORT_KEY, SORT_AS } from './store/segments.model';
import { filter, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Injectable({ providedIn: 'root' })
@Injectable()
export class SegmentsService {
  constructor(private store$: Store<AppState>) {}

  isLoadingSegments$ = this.store$.pipe(select(selectIsLoadingSegments));
  selectedSegment$ = this.store$.pipe(select(selectSelectedSegment));
  allSegments$ = this.store$.pipe(
    select(selectAllSegments),
    filter(allSegments => !!allSegments),
    map(Segments =>
      Segments.sort((a, b) => {
        const d1 = new Date(a.createdAt);
        const d2 = new Date(b.createdAt);
        return d1 < d2 ? 1 : d1 > d2 ? -1 : 0;
      })
    )
  );
  // allSegmentsKeys$ = this.store$.pipe(
  //   select(selectAllSegments),
  //   filter(allSegments => !!allSegments),
  //   map(Segments => Segments.map(Segment => Segment.key))
  // );

  isInitialSegmentsLoading() {
    return combineLatest(
      this.store$.pipe(select(selectIsLoadingSegments)),
      this.allSegments$
      ).pipe(
      map(([isLoading, experiments]) => {
        return !isLoading || !!experiments.length;
      })
    );
  }

  isAllSegmentsFetched() {
    return combineLatest(
      this.store$.pipe(select(selectSkipSegments)),
      this.store$.pipe(select(selectTotalSegments))
    ).pipe(
      map(([skipSegments, totalSegments]) => skipSegments === totalSegments)
    );
  }

  fetchSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting }));
  }

  createNewSegment(segment: Segment) {
    this.store$.dispatch(SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.CREATE_NEW_SEGMENT }));
  }

  updateSegmentstatus(segmentId: string, status: boolean) {
    this.store$.dispatch(SegmentsActions.actionUpdateSegmentStatus({ segmentId, status }));
  }

  deleteSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionDeleteSegment({ segmentId }));
  }

  updateSegment(segment: Segment) {
    this.store$.dispatch(SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.UPDATE_SEGMENT }));
  }

  // getActiveVariation(Segment: Segment, type?: boolean) {
  //   const status = type === undefined  ? Segment.status : type;
  //   const existedVariation = Segment.variations.filter(variation => {
  //     if (variation.defaultVariation && variation.defaultVariation.indexOf(status) !== -1) {
  //       return variation;
  //     }
  //   })[0];
  //   return  existedVariation ? existedVariation.value : '';
  // }

  setSearchKey(searchKey: SEGMENTS_SEARCH_SORT_KEY) {
    this.store$.dispatch(SegmentsActions.actionSetSearchKey({ searchKey }));
  }

  setSearchString(searchString: string) {
    this.store$.dispatch(SegmentsActions.actionSetSearchString({ searchString }));
  }

  setSortKey(sortKey: SEGMENTS_SEARCH_SORT_KEY) {
    this.store$.dispatch(SegmentsActions.actionSetSortKey({ sortKey }));
  }

  setSortingType(sortingType: SORT_AS) {
    this.store$.dispatch(SegmentsActions.actionSetSortingType({ sortingType }));
  }
}
