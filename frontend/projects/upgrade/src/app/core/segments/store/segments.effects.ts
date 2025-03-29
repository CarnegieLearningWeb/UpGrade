import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { SegmentsDataService } from '../segments.data.service';
import * as SegmentsActions from './segments.actions';
import { Segment, UpsertSegmentType } from './segments.model';
import { selectAllSegments } from './segments.selectors';
import JSZip from 'jszip';
import { SERVER_ERROR } from 'upgrade_types';

@Injectable()
export class SegmentsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private router: Router
  ) {}

  fetchSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments),
      withLatestFrom(this.store$.pipe(select(selectAllSegments))),
      switchMap(() =>
        this.segmentsDataService.fetchSegments().pipe(
          map((data: any) =>
            SegmentsActions.actionFetchSegmentsSuccess({
              segments: data.segmentsData,
              experimentSegmentInclusion: data.experimentSegmentInclusionData,
              experimentSegmentExclusion: data.experimentSegmentExclusionData,
              featureFlagSegmentInclusion: data.featureFlagSegmentInclusionData,
              featureFlagSegmentExclusion: data.featureFlagSegmentExclusionData,
            })
          ),
          catchError(() => [SegmentsActions.actionFetchSegmentsFailure()])
        )
      )
    )
  );

  getSegmentById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionGetSegmentById),
      map((action) => action.segmentId),
      filter((segmentId) => !!segmentId),
      switchMap((segmentId) =>
        this.segmentsDataService.getSegmentById(segmentId).pipe(
          map((data: Segment) => {
            return SegmentsActions.actionGetSegmentByIdSuccess({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionGetSegmentByIdFailure()])
        )
      )
    )
  );

  upsertSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionUpsertSegment),
      map((action) => ({ Segment: action.segment, actionType: action.actionType })),
      filter(({ Segment }) => !!Segment),
      switchMap(({ Segment, actionType }) => {
        const action =
          actionType === UpsertSegmentType.CREATE_NEW_SEGMENT
            ? this.segmentsDataService.createNewSegment(Segment)
            : actionType === UpsertSegmentType.IMPORT_SEGMENT
            ? this.segmentsDataService.importSegments([])
            : this.segmentsDataService.updateSegment(Segment);
        return action.pipe(
          map((data: Segment) => {
            if (actionType === UpsertSegmentType.CREATE_NEW_SEGMENT) {
              this.router.navigate(['/segments']);
            }
            return SegmentsActions.actionUpsertSegmentSuccess({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionUpsertSegmentFailure()])
        );
      })
    )
  );

  // actionAddSegment dispatch POST segment
  addSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionAddSegment),
      switchMap((action) => {
        return this.segmentsDataService.addSegment(action.addSegmentRequest).pipe(
          map((response: Segment) => SegmentsActions.actionAddSegmentSuccess({ response })),
          tap(({ response }) => {
            this.router.navigate(['/segments', 'detail', response.id]);
          }),
          catchError(() => {
            return [SegmentsActions.actionAddSegmentFailure()];
          })
        );
      })
    )
  );

  updateSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionUpdateSegment),
      switchMap((action) => {
        return this.segmentsDataService.modifySegment(action.updateSegmentRequest).pipe(
          map((response: Segment) => SegmentsActions.actionUpdateSegmentSuccess({ response })),
          tap(({ response }) => {
            this.router.navigate(['/segments', 'detail', response.id]);
          }),
          catchError(() => {
            return [SegmentsActions.actionUpdateSegmentFailure()];
          })
        );
      })
    )
  );

  deleteSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegment),
      map((action) => action.segmentId),
      filter((id) => !!id),
      switchMap((id) =>
        this.segmentsDataService.deleteSegment(id).pipe(
          map((data: any) => {
            this.router.navigate(['/segments']);
            return SegmentsActions.actionDeleteSegmentSuccess({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionDeleteSegmentFailure()])
        )
      )
    )
  );

  exportSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionExportSegments),
      map((action) => ({ segmentIds: action.segmentIds })),
      filter(({ segmentIds }) => !!segmentIds),
      switchMap(({ segmentIds }) =>
        this.segmentsDataService.exportSegments(segmentIds).pipe(
          map((data: Segment[]) => {
            if (data.length > 1) {
              const zip = new JSZip();
              data.forEach((segment, index) => {
                zip.file(segment.name + ' (File ' + (index + 1) + ').json', JSON.stringify(segment));
              });
              zip.generateAsync({ type: 'base64' }).then((content) => {
                this.download('Segments.zip', content, true);
              });
            } else {
              this.download(data[0].name + '.json', data[0], false);
            }
            return SegmentsActions.actionExportSegmentSuccess();
          }),
          catchError(() => [SegmentsActions.actionExportSegmentFailure()])
        )
      )
    )
  );

  private download(filename, text, isZip: boolean) {
    const element = document.createElement('a');
    isZip
      ? element.setAttribute('href', 'data:application/zip;base64,' + text)
      : element.setAttribute('href', 'data:text/plain;charset=utf-8,' + JSON.stringify(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
