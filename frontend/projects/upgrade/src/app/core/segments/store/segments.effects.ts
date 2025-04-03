import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, concatMap, filter, first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppState } from '../../core.module';
import { SegmentsDataService } from '../segments.data.service';
import * as SegmentsActions from './segments.actions';
import { NUMBER_OF_SEGMENTS, Segment, SegmentsPaginationParams, UpsertSegmentType } from './segments.model';
import {
  selectAllSegments,
  selectAreAllSegmentsFetched,
  selectGlobalSegments,
  selectSearchKey,
  selectSearchString,
  selectSkipSegments,
  selectSortAs,
  selectSortKey,
  selectTotalSegments,
} from './segments.selectors';
import JSZip from 'jszip';
import { of } from 'rxjs';

@Injectable()
export class SegmentsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private router: Router
  ) {}

  fetchSegmentsPaginated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipSegments)),
        this.store$.pipe(select(selectTotalSegments)),
        this.store$.pipe(select(selectSearchKey)),
        this.store$.pipe(select(selectSortKey)),
        this.store$.pipe(select(selectSortAs)),
        this.store$.pipe(select(selectAreAllSegmentsFetched))
      ),
      filter(([fromStarting, skip, total, areAllFetched]) => {
        return !areAllFetched || skip < total || total === null || fromStarting;
      }),
      tap(() => {
        this.store$.dispatch(SegmentsActions.actionSetIsLoadingSegments({ isLoadingSegments: true }));
      }),
      switchMap(([fromStarting, skip, _, searchKey, sortKey, sortAs]) => {
        let searchString = null;
        // As withLatestFrom does not support more than 5 arguments
        // TODO: Find alternative
        this.getSearchString$().subscribe((searchInput) => {
          searchString = searchInput;
        });
        let params: SegmentsPaginationParams = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_SEGMENTS,
        };
        if (sortKey) {
          params = {
            ...params,
            sortParams: {
              key: sortKey,
              sortAs,
            },
          };
        }
        if (searchString) {
          params = {
            ...params,
            searchParams: {
              key: searchKey,
              string: searchString,
            },
          };
        }
        return this.segmentsDataService.fetchSegmentsPaginated(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [SegmentsActions.actionSetSkipSegments({ skipSegments: 0 })] : [];
            return [
              ...actions,
              SegmentsActions.actionFetchSegmentsSuccess({
                segments: data.nodes.segmentsData,
                totalSegments: data.total,
                experimentSegmentInclusion: data.nodes.experimentSegmentInclusionData,
                experimentSegmentExclusion: data.nodes.experimentSegmentExclusionData,
                featureFlagSegmentInclusion: data.nodes.featureFlagSegmentInclusionData,
                featureFlagSegmentExclusion: data.nodes.featureFlagSegmentExclusionData,
              }),
            ];
          }),
          catchError(() => [SegmentsActions.actionFetchSegmentsFailure()])
        );
      })
    )
  );

  fetchAllSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionfetchAllSegments),
      withLatestFrom(this.store$.pipe(select(selectAllSegments))),
      switchMap(() =>
        this.segmentsDataService.fetchAllSegments().pipe(
          map((data: any) =>
            SegmentsActions.actionFetchSegmentsSuccessLegacyGetAll({
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

  fetchGlobalSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchGlobalSegments),
      withLatestFrom(this.store$.pipe(select(selectGlobalSegments))),
      switchMap(() =>
        this.segmentsDataService.fetchGlobalSegments().pipe(
          map((data: any) =>
            SegmentsActions.actionFetchGlobalSegmentsSuccess({
              globalSegments: data,
            })
          ),
          catchError(() => [SegmentsActions.actionFetchGlobalSegmentsFailure()])
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

  addSegment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionAddSegment),
      switchMap((action) => {
        return this.segmentsDataService.addSegment(action.addSegmentRequest).pipe(
          map((response: Segment) => SegmentsActions.actionAddSegmentSuccess({ segment: response })),
          tap(({ segment }) => {
            this.router.navigate(['/segments', 'detail', segment.id]);
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
          concatMap((response: Segment) => {
            return [
              SegmentsActions.actionUpdateSegmentSuccess({ segment: response }),
              SegmentsActions.actionGetSegmentById({ segmentId: response.id }),
            ];
          }),
          catchError(() => {
            return of(SegmentsActions.actionUpdateSegmentFailure());
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

  private getSearchString$ = () => this.store$.pipe(select(selectSearchString)).pipe(first());

  // TODO: this should be replaced with the common download() method in common-export-helpers service in new experience
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
