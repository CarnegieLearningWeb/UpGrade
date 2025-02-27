import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { SegmentsDataService_LEGACY } from '../segments.data.service._LEGACY';
import * as SegmentsActions from './segments.actions._LEGACY';
import { Segment_LEGACY, UpsertSegmentType_LEGACY } from './segments.model._LEGACY';
import { selectAllSegments_LEGACY } from './segments.selectors._LEGACY';
import JSZip from 'jszip';

@Injectable()
export class SegmentsEffects_LEGACY {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService_LEGACY,
    private router: Router
  ) {}

  fetchSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments_LEGACY),
      withLatestFrom(this.store$.pipe(select(selectAllSegments_LEGACY))),
      switchMap(() =>
        this.segmentsDataService.fetchSegments().pipe(
          map((data: any) =>
            SegmentsActions.actionFetchSegmentsSuccess_LEGACY({
              segments: data.segmentsData,
              experimentSegmentInclusion: data.experimentSegmentInclusionData,
              experimentSegmentExclusion: data.experimentSegmentExclusionData,
              featureFlagSegmentInclusion: data.featureFlagSegmentInclusionData,
              featureFlagSegmentExclusion: data.featureFlagSegmentExclusionData,
            })
          ),
          catchError(() => [SegmentsActions.actionFetchSegmentsFailure_LEGACY()])
        )
      )
    )
  );

  getSegmentById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionGetSegmentById_LEGACY),
      map((action) => action.segmentId),
      filter((segmentId) => !!segmentId),
      switchMap((segmentId) =>
        this.segmentsDataService.getSegmentById(segmentId).pipe(
          map((data: Segment_LEGACY) => {
            return SegmentsActions.actionGetSegmentByIdSuccess_LEGACY({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionGetSegmentByIdFailure_LEGACY()])
        )
      )
    )
  );

  upsertSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionUpsertSegment_LEGACY),
      map((action) => ({ Segment: action.segment, actionType: action.actionType })),
      filter(({ Segment }) => !!Segment),
      switchMap(({ Segment, actionType }) => {
        const action =
          actionType === UpsertSegmentType_LEGACY.CREATE_NEW_SEGMENT
            ? this.segmentsDataService.createNewSegment(Segment)
            : actionType === UpsertSegmentType_LEGACY.IMPORT_SEGMENT
            ? this.segmentsDataService.importSegments([])
            : this.segmentsDataService.updateSegment(Segment);
        return action.pipe(
          map((data: Segment_LEGACY) => {
            if (actionType === UpsertSegmentType_LEGACY.CREATE_NEW_SEGMENT) {
              this.router.navigate(['/segments']);
            }
            return SegmentsActions.actionUpsertSegmentSuccess_LEGACY({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionUpsertSegmentFailure_LEGACY()])
        );
      })
    )
  );

  deleteSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegment_LEGACY),
      map((action) => action.segmentId),
      filter((id) => !!id),
      switchMap((id) =>
        this.segmentsDataService.deleteSegment(id).pipe(
          map((data: any) => {
            this.router.navigate(['/segments']);
            return SegmentsActions.actionDeleteSegmentSuccess_LEGACY({ segment: data });
          }),
          catchError(() => [SegmentsActions.actionDeleteSegmentFailure_LEGACY()])
        )
      )
    )
  );

  exportSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionExportSegments_LEGACY),
      map((action) => ({ segmentIds: action.segmentIds })),
      filter(({ segmentIds }) => !!segmentIds),
      switchMap(({ segmentIds }) =>
        this.segmentsDataService.exportSegments(segmentIds).pipe(
          map((data: Segment_LEGACY[]) => {
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
            return SegmentsActions.actionExportSegmentSuccess_LEGACY();
          }),
          catchError(() => [SegmentsActions.actionExportSegmentFailure_LEGACY()])
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
