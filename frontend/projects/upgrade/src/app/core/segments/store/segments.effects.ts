import { SegmentsDataService } from '../segments.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as SegmentsActions from './segments.actions';
import { catchError, switchMap, map, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import { UpsertSegmentType, SegmentsPaginationParams, NUMBER_OF_SEGMENTS } from './segments.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import { selectTotalSegments, selectSearchKey, selectSkipSegments, selectSortKey, selectSortAs, selectSearchString } from './segments.selectors';
import { combineLatest } from 'rxjs';

@Injectable()
export class SegmentsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private router: Router
  ) { }

  // fetchSegments$ = createEffect(
  //   () => this.actions$.pipe(
  //     ofType(SegmentsActions.actionFetchSegments),
  //     map(action => action.fromStarting),
  //     withLatestFrom(
  //       this.store$.pipe(select(selectSkipSegments)),
  //       this.store$.pipe(select(selectTotalSegments)),
  //       this.store$.pipe(select(selectSearchKey)),
  //       this.store$.pipe(select(selectSortKey)),
  //       this.store$.pipe(select(selectSortAs)),
  //     ),
  //     filter(([fromStarting, skip, total]) => skip < total || total === null || fromStarting),
  //     tap(() => {
  //       this.store$.dispatch(SegmentsActions.actionSetIsLoadingSegments({ isLoadingSegments: true }));
  //     }),
  //     switchMap(([fromStarting, skip, _, searchKey, sortKey, sortAs]) => {
  //       let searchString = null;
  //       // As withLatestFrom does not support more than 5 arguments
  //       // TODO: Find alternative
  //       this.getSearchString$().subscribe(searchInput => {
  //         searchString = searchInput;
  //       });
  //       let params: SegmentsPaginationParams = {
  //         skip: fromStarting ? 0 : skip,
  //         take: NUMBER_OF_SEGMENTS
  //       };
  //       if (sortKey) {
  //         params = {
  //           ...params,
  //           sortParams: {
  //             key: sortKey,
  //             sortAs
  //           }
  //         };
  //       }
  //       if (searchString) {
  //         params = {
  //           ...params,
  //           searchParams: {
  //             key: searchKey,
  //             string: searchString
  //           }
  //         };
  //       }
  //       return this.segmentsDataService.fetchSegments(params).pipe(
  //         switchMap((data: any) => {
  //           const actions = fromStarting ? [SegmentsActions.actionSetSkipSegments({ skipSegments: 0 })] : [];
  //           return [
  //             ...actions,
  //             SegmentsActions.actionFetchSegmentsSuccess({ segments: data.nodes, totalSegments: data.total })
  //           ];
  //         }),
  //         catchError(() => [SegmentsActions.actionFetchSegmentsFailure()])
  //       )
  //     }
  //     )
  //   )
  // );

  upsertSegment$ = createEffect(
    () => this.actions$.pipe(
      ofType(SegmentsActions.actionUpsertSegment),
      map(action => ({ Segment: action.segment, actionType: action.actionType })),
      filter(({ Segment }) => !!Segment),
      switchMap(({ Segment, actionType }) => {
        const action = actionType === UpsertSegmentType.CREATE_NEW_SEGMENT
          ? this.segmentsDataService.createNewSegment(Segment)
          : this.segmentsDataService.updateSegment(Segment);
        return action.pipe(
          map((data: any) => SegmentsActions.actionUpsertSegmentSuccess({ segment: data })),
          catchError(() => [SegmentsActions.actionUpsertSegmentFailure()])
        )
      }
      )
    )
  );

  // updateSegment$ = createEffect(
  //   () => this.actions$.pipe(
  //     ofType(SegmentsActions.actionUpdateSegmentStatus),
  //     map(action => ({ SegmentId: action.segmentId, status: action.status })),
  //     filter(({ SegmentId, status }) => !!SegmentId),
  //     switchMap(({ SegmentId, status }) =>
  //       this.segmentsDataService.updateSegmentStatus(SegmentId, status).pipe(
  //         map((data: any) => SegmentsActions.actionUpdateSegmentStatusSuccess({ segment: data[0] })),
  //         catchError(() => [SegmentsActions.actionUpdateSegmentStatusFailure()])
  //       )
  //     )
  //   )
  // );

  deleteSegment$ = createEffect(
    () => this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegment),
      map(action => action.segmentId),
      filter(id => !!id),
      switchMap((id) =>
        this.segmentsDataService.deleteSegment(id).pipe(
          map((data: any) => {
            this.router.navigate(['/Segments']);
            return SegmentsActions.actionDeleteSegmentSuccess({ segment: data[0] })
          }),
          catchError(() => [SegmentsActions.actionDeleteSegmentFailure()])
        )
      )
    )
  );

  fetchSegmentsOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SegmentsActions.actionSetSearchString),
        map(action => action.searchString),
        tap(searchString => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchSegmentsOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SegmentsActions.actionSetSearchKey),
        withLatestFrom(this.store$.pipe(select(selectSearchString))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(SegmentsActions.actionFetchSegments({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  private getSearchString$ = () =>
  combineLatest(this.store$.pipe(select(selectSearchString))).pipe(
    map(([searchString]) => searchString),
    first()
  );
}
