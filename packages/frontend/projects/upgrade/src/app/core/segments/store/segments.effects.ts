import {
  batchDeleteEffect,
  reconcileBatchEffect,
  batchFinishedEffect,
  trackedListRequest,
} from '../../batch-actions/batch-actions.effects';
import { isBatchBusy } from '../../batch-actions/batch-actions.models';
import { batchResultCounts } from '../../batch-actions/batch-actions.helpers';
import { selectRootBatch, selectSegmentsState } from './segments.selectors';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, concatMap, filter, first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AppState, NotificationService } from '../../core.module';
import { TranslateService } from '@ngx-translate/core';
import { SegmentsDataService } from '../segments.data.service';
import * as SegmentsActions from './segments.actions';
import { LIST_OPTION_TYPE, NUMBER_OF_SEGMENTS, Segment, UpsertSegmentType } from './segments.model';
import { selectAllSegments, selectGlobalSegments, selectSearchString } from './segments.selectors';
import JSZip from 'jszip';
import { of } from 'rxjs';
import { isCanonicalEntityId, PAGE_ERROR_TYPE } from '@shared-component-lib/common-page-error/common-page-error.model';
import { LIST_FILTER_MODE, SEGMENT_STATUS, SERVER_ERROR } from 'upgrade_types';
import { SegmentsService } from '../segments.service';
import { CommonModalEventsService } from '../../../shared/services/common-modal-event.service';

@Injectable()
export class SegmentsEffects {
  batchDelete$ = createEffect(() =>
    batchDeleteEffect(
      this.actions$,
      this.store$.pipe(select(selectRootBatch)),
      SegmentsActions.batchActions,
      this.segmentsDataService
    )
  );
  reconcileBatch$ = createEffect(() =>
    reconcileBatchEffect(
      this.actions$,
      this.store$.pipe(select(selectRootBatch)),
      SegmentsActions.batchActions,
      this.segmentsDataService
    )
  );
  finishBatch$ = createEffect(() =>
    batchFinishedEffect(
      this.actions$,
      this.store$.pipe(select(selectRootBatch)),
      SegmentsActions.batchActions,
      (state) => {
        const counts = batchResultCounts(state);
        const hasWarnings = counts.hasErrors || counts.uncertain;
        const messageKey = hasWarnings
          ? 'batch-delete.result.segments'
          : `batch-delete.success.segments.${counts.deleted === 1 ? 'one' : 'other'}`;
        const message =
          this.translate.instant(messageKey, counts) +
          (counts.uncertain ? ' ' + this.translate.instant('batch-delete.result.uncertain') : '');
        if (hasWarnings) this.notificationService.showWarning(message);
        else this.notificationService.showSuccess(message);
        return [
          SegmentsActions.actionFetchSegments({ fromStarting: true, batchRefresh: true }),
          ...(counts.deleted || counts.absent ? [SegmentsActions.actionFetchListSegmentOptions()] : []),
        ];
      }
    )
  );

  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private segmentsDataService: SegmentsDataService,
    private segmentsService: SegmentsService,
    private router: Router,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private commonModalEventService: CommonModalEventsService
  ) {}

  fetchSegmentsPaginated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionFetchSegments),
      withLatestFrom(this.store$.pipe(select(selectSegmentsState))),
      filter(
        ([action, state]) =>
          !isBatchBusy(state.rootBatch) &&
          (!state.rootBatch.listLoading || action.fromStarting) &&
          (action.fromStarting || state.totalSegments === null || state.skipSegments < state.totalSegments)
      ),
      switchMap(([action, state]) => {
        const fromStarting = !!action.fromStarting;
        const params = {
          skip: fromStarting ? 0 : state.skipSegments,
          take: NUMBER_OF_SEGMENTS,
          ...(state.sortKey ? { sortParams: { key: state.sortKey, sortAs: state.sortAs } } : {}),
          ...(state.searchString ? { searchParams: { key: state.searchKey, string: state.searchString } } : {}),
        };
        return trackedListRequest(
          this.store$.pipe(select(selectRootBatch)),
          SegmentsActions.batchActions,
          (event) => this.store$.dispatch(event),
          fromStarting,
          !!action.batchRefresh,
          () => {
            this.store$.dispatch(SegmentsActions.actionSetIsLoadingSegments({ isLoadingSegments: true }));
            return this.segmentsDataService.fetchSegmentsPaginated(params, !!action.batchRefresh);
          },
          (data: any, requestId) => [
            SegmentsActions.actionFetchSegmentsSuccess({
              segments: data.nodes.segmentsData,
              totalSegments: data.total,
              experimentSegmentInclusion: data.nodes.experimentSegmentInclusionData,
              experimentSegmentExclusion: data.nodes.experimentSegmentExclusionData,
              featureFlagSegmentInclusion: data.nodes.featureFlagSegmentInclusionData,
              featureFlagSegmentExclusion: data.nodes.featureFlagSegmentExclusionData,
              allParentSegments: data.nodes.allParentSegments,
              fromStarting,
              batchListRequestId: requestId,
            }),
          ],
          () => [SegmentsActions.actionFetchSegmentsFailure()]
        );
      })
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
      switchMap((segmentId) => {
        if (!isCanonicalEntityId(segmentId)) {
          return of(SegmentsActions.actionGetSegmentByIdFailure({ segmentId, errorType: PAGE_ERROR_TYPE.NOT_FOUND }));
        }
        return this.segmentsDataService.getSegmentById(segmentId).pipe(
          map((data: any) => {
            return SegmentsActions.actionGetSegmentByIdSuccess({
              segment: data.segment,
              experimentSegmentInclusion: data.experimentSegmentInclusionData,
              experimentSegmentExclusion: data.experimentSegmentExclusionData,
              featureFlagSegmentInclusion: data.featureFlagSegmentInclusionData,
              featureFlagSegmentExclusion: data.featureFlagSegmentExclusionData,
              allParentSegments: data.allParentSegments,
            });
          }),
          catchError((error) => [
            SegmentsActions.actionGetSegmentByIdFailure({
              segmentId,
              errorType: error?.status === 404 ? PAGE_ERROR_TYPE.NOT_FOUND : PAGE_ERROR_TYPE.LOAD_FAILED,
            }),
          ])
        );
      })
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
              data = {
                ...data,
                status: data.status || SEGMENT_STATUS.UNUSED,
              };
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
          catchError((error) => {
            if (error?.error?.type === SERVER_ERROR.SEGMENT_DUPLICATE_NAME) {
              this.segmentsService.setDuplicateSegmentNameError(error.error);
            }
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
            this.notificationService.showSuccess(this.translate.instant('segments.lists.add-success.text'));
            this.commonModalEventService.forceCloseModal();
            if (action.list.listType?.toLowerCase() !== LIST_OPTION_TYPE.SEGMENT.toLowerCase()) {
              this.router.navigate([
                '/segments',
                'detail',
                action.list.id,
                'list',
                LIST_FILTER_MODE.EXCLUSION,
                listResponse.segment.id,
              ]);
            }
            return SegmentsActions.actionAddSegmentListSuccess({ listResponse });
          }),
          catchError((error) => {
            this.notificationService.showError(this.translate.instant('segments.lists.add-error.text'));
            return of(SegmentsActions.actionAddSegmentListFailure({ error }));
          })
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
            this.notificationService.showSuccess(this.translate.instant('segments.lists.update-success.text'));
            this.commonModalEventService.forceCloseModal();
            return SegmentsActions.actionUpdateSegmentListSuccess({ listResponse });
          }),
          catchError((error) => {
            this.notificationService.showError(this.translate.instant('segments.lists.update-error.text'));
            return of(SegmentsActions.actionUpdateSegmentListFailure({ error }));
          })
        );
      })
    )
  );

  deleteSegmentList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SegmentsActions.actionDeleteSegmentList),
      switchMap(({ segmentId, parentSegmentId }) => {
        return this.segmentsDataService.deleteSegmentList(segmentId, parentSegmentId).pipe(
          map(() => {
            this.notificationService.showSuccess(this.translate.instant('segments.lists.delete-success.text'));
            return SegmentsActions.actionDeleteSegmentListSuccess({ segmentId });
          }),
          catchError((error) => {
            this.notificationService.showError(this.translate.instant('segments.lists.delete-error.text'));
            return of(SegmentsActions.actionDeleteSegmentListFailure({ error }));
          })
        );
      })
    )
  );
}
