import { FeatureFlagsDataService } from '../feature-flags.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as FeatureFlagsActions from './feature-flags.actions';
import { catchError, switchMap, map, filter, withLatestFrom, tap, first } from 'rxjs/operators';
import { UpsertFeatureFlagType, FeatureFlagsPaginationParams, NUMBER_OF_FLAGS } from './feature-flags.model';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.module';
import {
  selectTotalFlags,
  selectSearchKey,
  selectSkipFlags,
  selectSortKey,
  selectSortAs,
  selectSearchString,
} from './feature-flags.selectors';

@Injectable()
export class FeatureFlagsEffects {
  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private featureFlagsDataService: FeatureFlagsDataService,
    private router: Router
  ) {}

  fetchFeatureFlags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionFetchFeatureFlags),
      map((action) => action.fromStarting),
      withLatestFrom(
        this.store$.pipe(select(selectSkipFlags)),
        this.store$.pipe(select(selectTotalFlags)),
        this.store$.pipe(select(selectSearchKey)),
        this.store$.pipe(select(selectSortKey)),
        this.store$.pipe(select(selectSortAs))
      ),
      filter(([fromStarting, skip, total]) => skip < total || total === null || fromStarting),
      tap(() => {
        this.store$.dispatch(FeatureFlagsActions.actionSetIsLoadingFeatureFlags({ isLoadingFeatureFlags: true }));
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
        return this.featureFlagsDataService.fetchFeatureFlags(params).pipe(
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

  upsertFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpsertFeatureFlag),
      map((action) => ({ flag: action.flag, actionType: action.actionType })),
      filter(({ flag }) => !!flag),
      switchMap(({ flag, actionType }) => {
        const action =
          actionType === UpsertFeatureFlagType.CREATE_NEW_FLAG
            ? this.featureFlagsDataService.createNewFeatureFlag(flag)
            : this.featureFlagsDataService.updateFeatureFlag(flag);
        return action.pipe(
          map((data: any) => FeatureFlagsActions.actionUpsertFeatureFlagSuccess({ flag: data })),
          catchError(() => [FeatureFlagsActions.actionUpsertFeatureFlagFailure()])
        );
      })
    )
  );

  updateFeatureFlag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFlagStatus),
      map((action) => ({ flagId: action.flagId, status: action.status })),
      filter(({ flagId, status }) => !!flagId),
      switchMap(({ flagId, status }) =>
        this.featureFlagsDataService.updateFlagStatus(flagId, status).pipe(
          map((data: any) => FeatureFlagsActions.actionUpdateFlagStatusSuccess({ flag: data[0] })),
          catchError(() => [FeatureFlagsActions.actionUpdateFlagStatusFailure()])
        )
      )
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
            this.router.navigate(['/featureFlags']);
            return FeatureFlagsActions.actionDeleteFeatureFlagSuccess({ flag: data[0] });
          }),
          catchError(() => [FeatureFlagsActions.actionDeleteFeatureFlagFailure()])
        )
      )
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

  private getSearchString$ = () => this.store$.pipe(select(selectSearchString)).pipe(first());
}
