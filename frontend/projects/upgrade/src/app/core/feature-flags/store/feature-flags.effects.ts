import { FeatureFlagsDataService } from '../feature-flags.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as featureFlagsActions from './feature-flags.actions';
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
  selectSelectedFeatureFlag,
} from './feature-flags.selectors';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { CommonExportHelpersService } from '../../../shared/services/common-export-helpers.service';
import { of } from 'rxjs';

@Injectable()
export class FeatureFlagsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private featureFlagsDataService: FeatureFlagsDataService,
    private router: Router,
    private notificationService: NotificationService,
    private commonExportHelpersService: CommonExportHelpersService,
  ) {}

  fetchFeatureFlags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionFetchFeatureFlags),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipFlags)),
        this.store$.pipe(select(selectTotalFlags)),
        this.store$.pipe(select(selectSearchKey)),
        this.store$.pipe(select(selectSortKey)),
        this.store$.pipe(select(selectSortAs)),
        this.store$.pipe(select(selectIsAllFlagsFetched))
      ),
      filter(([fromStarting, skip, total, searchKey, sortKey, sortAs, isAllFlagsFetched]) => {
        return !isAllFlagsFetched || skip < total || total === null || fromStarting;
      }),
      tap(() => {
        this.store$.dispatch(featureFlagsActions.actionSetIsLoadingFeatureFlags({ isLoadingFeatureFlags: true }));
      }),
      switchMap(([fromStarting, skip, _, searchKey, sortKey, sortAs]) => {
        let searchString = null;
        // As withLatestFrom does not support more than 5 arguments
        // TODO: Find alternative
        this.getSearchString$().subscribe((searchInput) => {
          searchString = searchInput;
        });
        let params: FeatureFlagsPaginationParams = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_FLAGS,
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
        return this.featureFlagsDataService.fetchFeatureFlagsPaginated(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [featureFlagsActions.actionSetSkipFlags({ skipFlags: 0 })] : [];
            return [
              ...actions,
              featureFlagsActions.actionFetchFeatureFlagsSuccess({ flags: data.nodes, totalFlags: data.total }),
            ];
          }),
          catchError(() => [featureFlagsActions.actionFetchFeatureFlagsFailure()])
        );
      })
    )
  );

  // actionCreateFeatureFlag dispatch POST feature flag
  addFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionAddFeatureFlag),
      switchMap((action) => {
        return this.featureFlagsDataService.addFeatureFlag(action.addFeatureFlagRequest).pipe(
          map((response) => featureFlagsActions.actionAddFeatureFlagSuccess({ response })),
          tap(({ response }) => {
            this.router.navigate(['/featureflags', 'detail', response.id]);
          }),
          catchError(() => [featureFlagsActions.actionAddFeatureFlagFailure()])
        );
      })
    )
  );

  updateFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionUpdateFeatureFlag),
      switchMap((action) => {
        return this.featureFlagsDataService.updateFeatureFlag(action.flag).pipe(
          map((response) => {
            return featureFlagsActions.actionUpdateFeatureFlagSuccess({ response });
          }),
          catchError(() => [featureFlagsActions.actionUpdateFeatureFlagFailure()])
        );
      })
    )
  );

  updateFeatureFlagStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionUpdateFeatureFlagStatus),
      switchMap((action) => {
        return this.featureFlagsDataService.updateFeatureFlagStatus(action.updateFeatureFlagStatusRequest).pipe(
          map((response) => {
            return featureFlagsActions.actionUpdateFeatureFlagStatusSuccess({ response });
          }),
          catchError(() => [featureFlagsActions.actionUpdateFeatureFlagStatusFailure()])
        );
      })
    )
  );

  deleteFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionDeleteFeatureFlag),
      map((action) => action.flagId),
      filter((id) => !!id),
      switchMap((id) =>
        this.featureFlagsDataService.deleteFeatureFlag(id).pipe(
          map((data: any) => {
            this.router.navigate(['/featureflags']);
            return featureFlagsActions.actionDeleteFeatureFlagSuccess({ flag: data[0] });
          }),
          catchError(() => [featureFlagsActions.actionDeleteFeatureFlagFailure()])
        )
      )
    )
  );

  uspertFeatureFlagInclusionList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionAddFeatureFlagInclusionList),
      map((action) => action.list),
      withLatestFrom(this.store$.pipe(select(selectSelectedFeatureFlag))),
      switchMap(([list, flag]) => {
        const request = {
          flagId: flag.id,
          ...list,
        };
        return this.featureFlagsDataService.addInclusionList(request).pipe(
          map((listResponse) => FeatureFlagsActions.actionUpsertFeatureFlagInclusionListSuccess({ listResponse })),
          catchError((error) => of(FeatureFlagsActions.actionUpsertFeatureFlagInclusionListFailure({ error })))
        );
      })
    )
  );

  fetchFeatureFlagsOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(featureFlagsActions.actionSetSearchString),
        map((action) => action.searchString),
        tap((searchString) => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(featureFlagsActions.actionFetchFeatureFlags({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchFlagsOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(featureFlagsActions.actionSetSearchKey),
        withLatestFrom(this.store$.pipe(select(selectSearchString))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(featureFlagsActions.actionFetchFeatureFlags({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchFeatureFlagById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionFetchFeatureFlagById),
      map((action) => action.featureFlagId),
      filter((featureFlagId) => !!featureFlagId),
      switchMap((featureFlagId) =>
        this.featureFlagsDataService.fetchFeatureFlagById(featureFlagId).pipe(
          map((data: FeatureFlag) => {
            return featureFlagsActions.actionFetchFeatureFlagByIdSuccess({ flag: data });
          }),
          catchError(() => [featureFlagsActions.actionFetchFeatureFlagByIdFailure()])
        )
      )
    )
  );

  emailFeatureFlagData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionEmailFeatureFlagData),
      map((action) => ({ featureFlagId: action.featureFlagId })),
      withLatestFrom(this.store$.pipe(select(selectCurrentUser))),
      filter(([{ featureFlagId }, { email }]) => !!featureFlagId && !!email),
      switchMap(([{ featureFlagId }, { email }]) =>
        this.featureFlagsDataService.emailFeatureFlagData(featureFlagId, email).pipe(
          map(() => {
            this.notificationService.showSuccess(`Email will be sent to ${email}`);
            return featureFlagsActions.actionEmailFeatureFlagDataSuccess();
          }),
          catchError(() => [featureFlagsActions.actionEmailFeatureFlagDataFailure()])
        )
      )
    )
  );

  exportFeatureFlagsDesign$ = createEffect(() =>
    this.actions$.pipe(
      ofType(featureFlagsActions.actionExportFeatureFlagDesign),
      map((action) => ({ featureFlagIds: action.featureFlagIds })),
      filter(({ featureFlagIds }) => !!featureFlagIds),
      switchMap(({ featureFlagIds }) =>
        this.featureFlagsDataService.exportFeatureFlagsDesign(featureFlagIds).pipe(
          map((data: FeatureFlag[]) => {
            if (data) {
              this.commonExportHelpersService.convertDataToDownload(data, 'FeatureFlags' );
              this.notificationService.showSuccess('Feature Flag Design JSON downloaded!');
            }
            return featureFlagsActions.actionExportFeatureFlagDesignSuccess();
          }),
          catchError(() => [featureFlagsActions.actionExportFeatureFlagDesignFailure()])
        )
      )
    )
  );

  private getSearchString$ = () => this.store$.pipe(select(selectSearchString)).pipe(first());
}
