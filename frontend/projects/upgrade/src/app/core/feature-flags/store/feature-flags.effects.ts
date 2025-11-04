import { FeatureFlagsDataService } from '../feature-flags.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as FeatureFlagsActions from './feature-flags.actions';
import { catchError, switchMap, map, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import { FeatureFlag, FeatureFlagsPaginationParams, NUMBER_OF_FLAGS } from './feature-flags.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState, NotificationService } from '../../core.module';
import {
  selectTotalFlags,
  selectSearchKey,
  selectSkipFlags,
  selectSortKey,
  selectSortAs,
  selectSearchString,
  selectIsAllFlagsFetched,
  selectFeatureFlagPaginationParams,
} from './feature-flags.selectors';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { CommonExportHelpersService } from '../../../shared/services/common-export-helpers.service';
import { of } from 'rxjs';
import { SERVER_ERROR } from 'upgrade_types';
import { CommonModalEventsService } from '../../../shared/services/common-modal-event.service';

@Injectable()
export class FeatureFlagsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private featureFlagsDataService: FeatureFlagsDataService,
    private router: Router,
    private notificationService: NotificationService,
    private commonExportHelpersService: CommonExportHelpersService,
    private commonModalEvents: CommonModalEventsService
  ) {}

  fetchFeatureFlags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionFetchFeatureFlags),
      map((action) => action.fromStarting),
      withLatestFrom(this.store$.pipe(select(selectFeatureFlagPaginationParams))),
      filter(([fromStarting, pagination]) => {
        return (
          !pagination.isAllFlagsFetched ||
          pagination.skip < pagination.total ||
          pagination.total === null ||
          fromStarting
        );
      }),
      tap(() => {
        this.store$.dispatch(FeatureFlagsActions.actionSetIsLoadingFeatureFlags({ isLoadingFeatureFlags: true }));
      }),
      switchMap(([fromStarting, pagination]) => {
        let params: FeatureFlagsPaginationParams = {
          skip: fromStarting ? 0 : pagination.skip,
          take: NUMBER_OF_FLAGS,
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
        return this.featureFlagsDataService.fetchFeatureFlagsPaginated(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [FeatureFlagsActions.actionSetSkipFlags({ skipFlags: 0 })] : [];
            return [
              ...actions,
              FeatureFlagsActions.actionFetchFeatureFlagsSuccess({ flags: data.nodes, totalFlags: data.total }),
            ];
          }),
          catchError(() => [FeatureFlagsActions.actionFetchFeatureFlagsFailure()])
        );
      })
    )
  );

  // actionAddFeatureFlag dispatch POST feature flag
  addFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionAddFeatureFlag),
      switchMap((action) => {
        return this.featureFlagsDataService.addFeatureFlag(action.addFeatureFlagRequest).pipe(
          map((response) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionAddFeatureFlagSuccess({ response });
          }),
          catchError((res) => {
            if (res.error.type == SERVER_ERROR.DUPLICATE_KEY) {
              return [FeatureFlagsActions.actionSetIsDuplicateKey({ duplicateKeyFound: true })];
            }
            return [FeatureFlagsActions.actionAddFeatureFlagFailure()];
          })
        );
      })
    )
  );

  navigateToFeatureFlagDetail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FeatureFlagsActions.actionAddFeatureFlagSuccess),
        tap(({ response }) => {
          this.router.navigate(['/featureflags', 'detail', response.id]);
        })
      ),
    { dispatch: false }
  );

  updateFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFeatureFlag),
      switchMap((action) => {
        return this.featureFlagsDataService.updateFeatureFlag(action.flag).pipe(
          map((response) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionUpdateFeatureFlagSuccess({ response });
          }),
          catchError((res) => {
            if (res.error.type == SERVER_ERROR.DUPLICATE_KEY) {
              return [FeatureFlagsActions.actionSetIsDuplicateKey({ duplicateKeyFound: true })];
            }
            return [FeatureFlagsActions.actionAddFeatureFlagFailure()];
          })
        );
      })
    )
  );

  updateFeatureFlagStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFeatureFlagStatus),
      switchMap((action) => {
        return this.featureFlagsDataService.updateFeatureFlagStatus(action.updateFeatureFlagStatusRequest).pipe(
          map((response) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionUpdateFeatureFlagStatusSuccess({ response });
          }),
          catchError(() => [FeatureFlagsActions.actionUpdateFeatureFlagStatusFailure()])
        );
      })
    )
  );

  updateFilterMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFilterMode),
      switchMap((action) => {
        return this.featureFlagsDataService.updateFilterMode(action.updateFilterModeRequest).pipe(
          map((response) => {
            return FeatureFlagsActions.actionUpdateFilterModeSuccess({ response });
          }),
          catchError(() => [FeatureFlagsActions.actionUpdateFilterModeFailure()])
        );
      })
    )
  );

  deleteFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionDeleteFeatureFlag),
      map((action) => action.flagId),
      filter((id) => !!id),
      switchMap((id) =>
        this.featureFlagsDataService.deleteFeatureFlag(id).pipe(
          map((data: any) => {
            this.commonModalEvents.forceCloseModal();
            this.router.navigate(['/featureflags']);
            return FeatureFlagsActions.actionDeleteFeatureFlagSuccess({ flag: data[0] });
          }),
          catchError(() => [FeatureFlagsActions.actionDeleteFeatureFlagFailure()])
        )
      )
    )
  );

  addFeatureFlagInclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionAddFeatureFlagInclusionList),
      switchMap((action) => {
        return this.featureFlagsDataService.addInclusionList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionAddFeatureFlagInclusionListSuccess({ listResponse });
          }),
          catchError((error) => of(FeatureFlagsActions.actionAddFeatureFlagInclusionListFailure({ error })))
        );
      })
    )
  );

  updateFeatureFlagInclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFeatureFlagInclusionList),
      switchMap((action) => {
        return this.featureFlagsDataService.updateInclusionList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionUpdateFeatureFlagInclusionListSuccess({ listResponse });
          }),
          catchError((error) => of(FeatureFlagsActions.actionUpdateFeatureFlagInclusionListFailure({ error })))
        );
      })
    )
  );

  deleteFeatureFlagInclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionDeleteFeatureFlagInclusionList),
      map((action) => action.segmentId),
      switchMap((segmentId) => {
        return this.featureFlagsDataService.deleteInclusionList(segmentId).pipe(
          map(() => FeatureFlagsActions.actionDeleteFeatureFlagInclusionListSuccess({ segmentId })),
          catchError((error) => of(FeatureFlagsActions.actionDeleteFeatureFlagInclusionListFailure({ error })))
        );
      })
    )
  );

  addFeatureFlagExclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionAddFeatureFlagExclusionList),
      switchMap((action) => {
        return this.featureFlagsDataService.addExclusionList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionAddFeatureFlagExclusionListSuccess({ listResponse });
          }),
          catchError((error) => of(FeatureFlagsActions.actionAddFeatureFlagExclusionListFailure({ error })))
        );
      })
    )
  );

  updateFeatureFlagExclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFeatureFlagExclusionList),
      switchMap((action) => {
        return this.featureFlagsDataService.updateExclusionList(action.list).pipe(
          map((listResponse) => {
            this.commonModalEvents.forceCloseModal();
            return FeatureFlagsActions.actionUpdateFeatureFlagExclusionListSuccess({ listResponse });
          }),
          catchError((error) => of(FeatureFlagsActions.actionUpdateFeatureFlagExclusionListFailure({ error })))
        );
      })
    )
  );

  deleteFeatureFlagExclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionDeleteFeatureFlagExclusionList),
      map((action) => action.segmentId),
      switchMap((segmentId) => {
        return this.featureFlagsDataService.deleteExclusionList(segmentId).pipe(
          map(() => FeatureFlagsActions.actionDeleteFeatureFlagExclusionListSuccess({ segmentId })),
          catchError((error) => of(FeatureFlagsActions.actionDeleteFeatureFlagExclusionListFailure({ error })))
        );
      })
    )
  );

  fetchFeatureFlagsOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FeatureFlagsActions.actionSetSearchString),
        map((action) => action.searchString),
        tap((searchString) => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchFlagsOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FeatureFlagsActions.actionSetSearchKey),
        withLatestFrom(this.store$.pipe(select(selectSearchString))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchFeatureFlagById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionFetchFeatureFlagById),
      map((action) => action.featureFlagId),
      filter((featureFlagId) => !!featureFlagId),
      switchMap((featureFlagId) =>
        this.featureFlagsDataService.fetchFeatureFlagById(featureFlagId).pipe(
          map((data: FeatureFlag) => {
            return FeatureFlagsActions.actionFetchFeatureFlagByIdSuccess({ flag: data });
          }),
          catchError(() => [FeatureFlagsActions.actionFetchFeatureFlagByIdFailure()])
        )
      )
    )
  );

  emailFeatureFlagData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionEmailFeatureFlagData),
      map((action) => ({ featureFlagId: action.featureFlagId })),
      withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
      filter(([{ featureFlagId }, { email }]) => !!featureFlagId && !!email),
      switchMap(([{ featureFlagId }, { email }]) =>
        this.featureFlagsDataService.emailFeatureFlagData(featureFlagId, email).pipe(
          map(() => {
            this.notificationService.showSuccess(`Email will be sent to ${email}`);
            return FeatureFlagsActions.actionEmailFeatureFlagDataSuccess();
          }),
          catchError(() => [FeatureFlagsActions.actionEmailFeatureFlagDataFailure()])
        )
      )
    )
  );

  exportFeatureFlagsDesign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionExportFeatureFlagDesign),
      map((action) => ({ featureFlagId: action.featureFlagId })),
      filter(({ featureFlagId }) => !!featureFlagId),
      switchMap(({ featureFlagId }) =>
        this.featureFlagsDataService.exportFeatureFlagsDesign(featureFlagId).pipe(
          map((exportFeatureFlagsDesign: FeatureFlag) => {
            if (exportFeatureFlagsDesign) {
              this.commonExportHelpersService.convertDataToDownload([exportFeatureFlagsDesign], 'FeatureFlags');
              this.notificationService.showSuccess('Feature Flag Design JSON downloaded!');
            }
            return FeatureFlagsActions.actionExportFeatureFlagDesignSuccess();
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to export Feature Flag Design');
            return of(FeatureFlagsActions.actionExportFeatureFlagDesignFailure());
          })
        )
      )
    )
  );

  exportAllIncludeListsDesign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionExportAllIncludeListsDesign),
      map((action) => ({ featureFlagId: action.featureFlagId })),
      switchMap(({ featureFlagId }) =>
        this.featureFlagsDataService.exportAllIncludeListsDesign(featureFlagId).pipe(
          map((exportedAllListsDesign: any[]) => {
            if (exportedAllListsDesign.length) {
              this.commonExportHelpersService.convertDataToDownload(exportedAllListsDesign, 'Lists');
              this.notificationService.showSuccess('Feature Flag Design JSON downloaded!');
            }
            return FeatureFlagsActions.actionExportAllIncludeListsDesignSuccess();
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to export All include lists Design');
            return of(FeatureFlagsActions.actionExportAllIncludeListsDesignFailure());
          })
        )
      )
    )
  );

  exportAllExcludeListsDesign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionExportAllExcludeListsDesign),
      map((action) => ({ featureFlagId: action.featureFlagId })),
      switchMap(({ featureFlagId }) =>
        this.featureFlagsDataService.exportAllExcludeListsDesign(featureFlagId).pipe(
          map((exportedAllListsDesign: any[]) => {
            if (exportedAllListsDesign) {
              this.commonExportHelpersService.convertDataToDownload(exportedAllListsDesign, 'Lists');
              this.notificationService.showSuccess('Feature Flag Design JSON downloaded!');
            }
            return FeatureFlagsActions.actionExportAllExcludeListsDesignSuccess();
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to export All exclude lists Design');
            return of(FeatureFlagsActions.actionExportAllExcludeListsDesignFailure());
          })
        )
      )
    )
  );

  private getSearchString$ = () => this.store$.pipe(select(selectSearchString)).pipe(first());
}
