import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core.state';
import * as SegmentsActions from './store/segments.actions';
import { selectIsLoadingSegments, selectAllSegments, selectSelectedSegment } from './store/segments.selectors';
import { SegmentVM, UpsertSegmentType } from './store/segments.model';
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

  // isAllSegmentsFetched() {
  //   return combineLatest(
  //     this.store$.pipe(select(selectSkipSegments)),
  //     this.store$.pipe(select(selectTotalSegments))
  //   ).pipe(
  //     map(([skipSegments, totalSegments]) => skipSegments === totalSegments)
  //   );
  // }

  fetchSegments(fromStarting?: boolean) {
    this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting }));
  }

  createNewSegment(segment: SegmentVM) {
    this.store$.dispatch(SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.CREATE_NEW_SEGMENT }));
  }

  deleteSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionDeleteSegment({ segmentId }));
  }

  updateSegment(segment: SegmentVM) {
    this.store$.dispatch(SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.UPDATE_SEGMENT }));
  }

  exportSegment(segmentId: string) {
    this.store$.dispatch(SegmentsActions.actionExportSegment({ segmentId }));
  }

  importSegment(segment: SegmentVM) {
    this.store$.dispatch(SegmentsActions.actionUpsertSegment({ segment, actionType: UpsertSegmentType.IMPORT_SEGMENT }));
  }
}
