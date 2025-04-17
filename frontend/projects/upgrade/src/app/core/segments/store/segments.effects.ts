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
  selectGlobalSegments,
  selectSearchString,
  selectSegmentPaginationParams,
} from './segments.selectors';
import JSZip from 'jszip';
import { of } from 'rxjs';
import { SERVER_ERROR } from 'upgrade_types';
import { SegmentsService } from '../segments.service';
import { CommonModalEventsService } from '../../../shared/services/common-modal-event.service';

@Injectable()
export class SegmentsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private segmentsService: SegmentsService,
    private router: Router,
    private commonModalEventService: CommonModalEventsService
  ) {}

  fetchSegmentsPaginated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments),
      map((action) => action.fromStarting),
      withLatestFrom(this.store$.pipe(select(selectSegmentPaginationParams))),
      filter(([fromStarting, pagination]) => {
        return (
          !pagination.areAllFetched || pagination.skip < pagination.total || pagination.total === null || fromStarting
        );
      }),
      tap(() => {
        this.store$.dispatch(SegmentsActions.actionSetIsLoadingSegments({ isLoadingSegments: true }));
      }),
      switchMap(([fromStarting, pagination]) => {
        let params: SegmentsPaginationParams = {
          skip: fromStarting ? 0 : pagination.skip,
          take: NUMBER_OF_SEGMENTS,
        };
        if (pagination.sortKey) {
          params = {
            ...params,
            sortParams: {
              key: pagination.sortKey,
              sortAs: pagination.sortAs,
            },
          };
        }
        if (pagination.searchString) {
          params = {
            ...params,
            searchParams: {
              key: pagination.searchKey,
              string: pagination.searchString,
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

  fetchListSegmentOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchListSegmentOptions),
      switchMap(() =>
        this.segmentsDataService.fetchAllSegments().pipe(
          map((data: { segmentsData: Segment[] }) => {
            const listSegmentOptions = data.segmentsData.map(({ name, id, context }) => {
              return {
                name,
                id,
                context,
              };
            });
            return SegmentsActions.actionFetchListSegmentOptionsSuccess({ listSegmentOptions });
          }),
          catchError(() => [SegmentsActions.actionFetchListSegmentOptionsFailure()])
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
          map((response: Segment) => {
            this.commonModalEventService.forceCloseModal();
            return SegmentsActions.actionAddSegmentSuccess({ segment: response });
          }),
          catchError((error) => {
            if (error?.error?.type === SERVER_ERROR.SEGMENT_DUPLICATE_NAME) {
              this.segmentsService.setDuplicateSegmentNameError(error.error);
            }
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
            this.commonModalEventService.forceCloseModal();
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

  navigateToSegmentDetail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SegmentsActions.actionAddSegmentSuccess),
        tap(({ segment }) => {
          this.router.navigate(['/segments', 'detail', segment.id]);
        })
      ),
    { dispatch: false }
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

  addSegmentList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionAddSegmentList),
      switchMap((action) => {
        return this.segmentsDataService.addSegmentList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEventService.forceCloseModal();
            return SegmentsActions.actionAddSegmentListSuccess({ listResponse });
          }),
          catchError((error) => of(SegmentsActions.actionAddSegmentListFailure({ error })))
        );
      })
    )
  );

  updateSegmentList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionUpdateSegmentList),
      switchMap((action) => {
        return this.segmentsDataService.updateSegmentList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEventService.forceCloseModal();
            return SegmentsActions.actionUpdateSegmentListSuccess({ listResponse });
          }),
          catchError((error) => of(SegmentsActions.actionUpdateSegmentListFailure({ error })))
        );
      })
    )
  );

  deleteSegmentList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegmentList),
      switchMap(({ segmentId, parentSegmentId }) => {
        return this.segmentsDataService.deleteSegmentList(segmentId, parentSegmentId).pipe(
          map(() => SegmentsActions.actionDeleteSegmentListSuccess({ segmentId })),
          catchError((error) => of(SegmentsActions.actionDeleteSegmentListFailure({ error })))
        );
      })
    )
  );
}
