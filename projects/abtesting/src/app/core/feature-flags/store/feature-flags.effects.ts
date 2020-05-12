import { FeatureFlagsDataService } from '../feature-flags.data.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import * as FeatureFlagsActions from './feature-flags.actions';
import { catchError, switchMap, map, filter } from 'rxjs/operators';
import { FeatureFlag, UpsertFeatureFlagType } from './feature-flags.model';
import { Router } from '@angular/router';

@Injectable()
export class FeatureFlagsEffects {
  constructor(
    private actions$: Actions,
    private featureFlagsDataService: FeatureFlagsDataService,
    private router: Router
  ) { }

  fetchAllFeatureFlags$ = createEffect(
    () => this.actions$.pipe(
      ofType(FeatureFlagsActions.actionFetchAllFeatureFlags),
      switchMap(() =>
        this.featureFlagsDataService.fetchAllFeatureFlags().pipe(
          map((flags: FeatureFlag[]) => FeatureFlagsActions.actionFetchAllFeatureFlagsSuccess({ flags })),
          catchError(() => [FeatureFlagsActions.actionFetchAllFeatureFlagsFailure()])
        )
      )
    )
  );

  upsertFeatureFlag$ = createEffect(
    () => this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpsertFeatureFlag),
      map(action => ({ flag: action.flag, actionType: action.actionType })),
      filter(({ flag }) => !!flag),
      switchMap(({ flag, actionType }) => {
        const action = actionType === UpsertFeatureFlagType.CREATE_NEW_FLAG
          ? this.featureFlagsDataService.createNewFeatureFlag(flag)
          : this.featureFlagsDataService.updateFeatureFlag(flag);
        return action.pipe(
          map((data: any) => FeatureFlagsActions.actionUpsertFeatureFlagSuccess({ flag: data })),
          catchError(() => [FeatureFlagsActions.actionUpsertFeatureFlagFailure()])
        )
      }
      )
    )
  );

  updateFeatureFlag$ = createEffect(
    () => this.actions$.pipe(
      ofType(FeatureFlagsActions.actionUpdateFlagStatus),
      map(action => ({ flagId: action.flagId, status: action.status })),
      filter(({ flagId, status }) => !!flagId),
      switchMap(({ flagId, status }) =>
        this.featureFlagsDataService.updateFlagStatus(flagId, status).pipe(
          map((data: any) => FeatureFlagsActions.actionUpdateFlagStatusSuccess({ flag: data[0] })),
          catchError(() => [FeatureFlagsActions.actionUpdateFlagStatusFailure()])
        )
      )
    )
  );

  deleteFeatureFlag$ = createEffect(
    () => this.actions$.pipe(
      ofType(FeatureFlagsActions.actionDeleteFeatureFlag),
      map(action => action.flagId),
      filter(id => !!id),
      switchMap((id) =>
        this.featureFlagsDataService.deleteFeatureFlag(id).pipe(
          map((data: any) => {
            this.router.navigate(['/featureFlags']);
            return FeatureFlagsActions.actionDeleteFeatureFlagSuccess({ flag: data[0] })
          }),
          catchError(() => [FeatureFlagsActions.actionDeleteFeatureFlagFailure()])
        )
      )
    )
  );
}
