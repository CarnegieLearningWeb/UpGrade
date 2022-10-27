import { SegmentsDataService } from '../segments.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as SegmentsActions from './segments.actions';
import { catchError, switchMap, map, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import { UpsertSegmentType } from './segments.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import { combineLatest } from 'rxjs';
import { selectAllSegments } from './segments.selectors';
import { Segment } from './segments.model';

@Injectable()
export class SegmentsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private router: Router
  ) { }

  fetchSegments$ = createEffect(
    () => this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments),
      withLatestFrom(
        this.store$.pipe(select(selectAllSegments))
      ),
      switchMap(() =>
        this.segmentsDataService.fetchSegments().pipe(
          map((data: any) => SegmentsActions.actionFetchSegmentsSuccess({ segments: data.segmentsData, experimentSegmentInclusion: data.experimentSegmentInclusionData, experimentSegmentExclusion: data.experimentSegmentExclusionData })),
          catchError(() => [SegmentsActions.actionFetchSegmentsFailure()])
        )
      )
    )
  );

  upsertSegment$ = createEffect(
    () => this.actions$.pipe(
      ofType(SegmentsActions.actionUpsertSegment),
      map(action => ({ Segment: action.segment, actionType: action.actionType })),
      filter(({ Segment }) => !!Segment),
      switchMap(({ Segment, actionType }) => {
        const action = actionType === UpsertSegmentType.CREATE_NEW_SEGMENT
          ? this.segmentsDataService.createNewSegment(Segment)
          : actionType === UpsertSegmentType.IMPORT_SEGMENT
          ? this.segmentsDataService.importSegment(Segment)
          : this.segmentsDataService.updateSegment(Segment);
        return action.pipe(
          map((data: Segment) => {
            if (actionType === UpsertSegmentType.CREATE_NEW_SEGMENT) {
              this.router.navigate(['/segments']);
            }
            return  SegmentsActions.actionUpsertSegmentSuccess({ segment: data })
          }),
          catchError(() => [SegmentsActions.actionUpsertSegmentFailure()])
        )
      })
    )
  );

  deleteSegment$ = createEffect(
    () => this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegment),
      map(action => action.segmentId),
      filter(id => !!id),
      switchMap((id) =>
        this.segmentsDataService.deleteSegment(id).pipe(
          map((data: any) => {
            this.router.navigate(['/segments']);
            return SegmentsActions.actionDeleteSegmentSuccess({ segment: data[0] })
          }),
          catchError(() => [SegmentsActions.actionDeleteSegmentFailure()])
        )
      )
    )
  );

  exportSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionExportSegment),
      map(action => ({ segmentId: action.segmentId })),
      filter(( {segmentId} ) => !!segmentId),
      switchMap(({ segmentId }) =>
        this.segmentsDataService.exportSegment(segmentId).pipe(
          map((data: any) => {
            this.download(data.name + '.json', data);
            return SegmentsActions.actionExportSegmentSuccess();
          }),
          catchError(() => [SegmentsActions.actionExportSegmentFailure()])
        )
      )
    )
  );

  private download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
