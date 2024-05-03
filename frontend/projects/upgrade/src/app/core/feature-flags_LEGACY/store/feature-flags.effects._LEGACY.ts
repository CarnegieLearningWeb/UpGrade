import { FeatureFlagsDataService_LEGACY } from '../feature-flags.data.service._LEGACY';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as FeatureFlagsActions from './feature-flags.actions._LEGACY';
import { catchError, switchMap, map, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import {
  UpsertFeatureFlagType_LEGACY,
  FeatureFlagsPaginationParams_LEGACY,
  NUMBER_OF_FLAGS_LEGACY,
} from './feature-flags.model._LEGACY';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import {
  selectTotalFlags_LEGACY,
  selectSearchKey_LEGACY,
  selectSkipFlags_LEGACY,
  selectSortKey_LEGACY,
  selectSortAs_LEGACY,
  selectSearchString_LEGACY,
} from './feature-flags.selectors._LEGACY';

@Injectable()
export class FeatureFlagsEffects_LEGACY {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private featureFlagsDataService: FeatureFlagsDataService_LEGACY,
    private router: Router
  ) {}

  fetchFeatureFlags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionFetchFeatureFlags_LEGACY),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipFlags_LEGACY)),
        this.store$.pipe(select(selectTotalFlags_LEGACY)),
        this.store$.pipe(select(selectSearchKey_LEGACY)),
        this.store$.pipe(select(selectSortKey_LEGACY)),
        this.store$.pipe(select(selectSortAs_LEGACY))
      ),
      filter(([fromStarting, skip, total]) => skip < total || total === null || fromStarting),
      tap(() => {
        this.store$.dispatch(
          FeatureFlagsActions.actionSetIsLoadingFeatureFlags_LEGACY({ isLoadingFeatureFlags: true })
        );
      }),
      switchMap(([fromStarting, skip, _, searchKey, sortKey, sortAs]) => {
        let searchString = null;
        // As withLatestFrom does not support more than 5 arguments
        // TODO: Find alternative
        this.getSearchString$().subscribe((searchInput) => {
          searchString = searchInput;
        });
        let params: FeatureFlagsPaginationParams_LEGACY = {
          skip: fromStarting ? 0 : skip,
          take: NUMBER_OF_FLAGS_LEGACY,
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
        return this.featureFlagsDataService.fetchFeatureFlags(params).pipe(
          switchMap((data: any) => {
            const actions = fromStarting ? [FeatureFlagsActions.actionSetSkipFlags_LEGACY({ skipFlags: 0 })] : [];
            return [
              ...actions,
              FeatureFlagsActions.actionFetchFeatureFlagsSuccess_LEGACY({ flags: data.nodes, totalFlags: data.total }),
            ];
          }),
          catchError(() => [FeatureFlagsActions.actionFetchFeatureFlagsFailure_LEGACY()])
        );
      })
    )
  );

  upsertFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpsertFeatureFlag_LEGACY),
      map((action) => ({ flag: action.flag, actionType: action.actionType })),
      filter(({ flag }) => !!flag),
      switchMap(({ flag, actionType }) => {
        const action =
          actionType === UpsertFeatureFlagType_LEGACY.CREATE_NEW_FLAG
            ? this.featureFlagsDataService.createNewFeatureFlag(flag)
            : this.featureFlagsDataService.updateFeatureFlag(flag);
        return action.pipe(
          map((data: any) => FeatureFlagsActions.actionUpsertFeatureFlagSuccess_LEGACY({ flag: data })),
          catchError(() => [FeatureFlagsActions.actionUpsertFeatureFlagFailure_LEGACY()])
        );
      })
    )
  );

  updateFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFlagStatus_LEGACY),
      map((action) => ({ flagId: action.flagId, status: action.status })),
      filter(({ flagId, status }) => !!flagId),
      switchMap(({ flagId, status }) =>
        this.featureFlagsDataService.updateFlagStatus(flagId, status).pipe(
          map((data: any) => FeatureFlagsActions.actionUpdateFlagStatusSuccess_LEGACY({ flag: data[0] })),
          catchError(() => [FeatureFlagsActions.actionUpdateFlagStatusFailure_LEGACY()])
        )
      )
    )
  );

  deleteFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionDeleteFeatureFlag_LEGACY),
      map((action) => action.flagId),
      filter((id) => !!id),
      switchMap((id) =>
        this.featureFlagsDataService.deleteFeatureFlag(id).pipe(
          map((data: any) => {
            this.router.navigate(['/featureflags']);
            return FeatureFlagsActions.actionDeleteFeatureFlagSuccess_LEGACY({ flag: data[0] });
          }),
          catchError(() => [FeatureFlagsActions.actionDeleteFeatureFlagFailure_LEGACY()])
        )
      )
    )
  );

  fetchFeatureFlagsOnSearchString$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FeatureFlagsActions.actionSetSearchString_LEGACY),
        map((action) => action.searchString),
        tap((searchString) => {
          // Allow empty string as we erasing text from search input
          if (searchString !== null) {
            this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags_LEGACY({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  fetchFlagsOnSearchKeyChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FeatureFlagsActions.actionSetSearchKey_LEGACY),
        withLatestFrom(this.store$.pipe(select(selectSearchString_LEGACY))),
        tap(([_, searchString]) => {
          if (searchString) {
            this.store$.dispatch(FeatureFlagsActions.actionFetchFeatureFlags_LEGACY({ fromStarting: true }));
          }
        })
      ),
    { dispatch: false }
  );

  private getSearchString$ = () => this.store$.pipe(select(selectSearchString_LEGACY)).pipe(first());
}
