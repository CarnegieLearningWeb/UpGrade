import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, filter, catchError, withLatestFrom } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import * as StratificationFactorsActions from './stratification-factors.actions';
import { StratificationFactorsDataService } from '../stratification-factors.data.service';
import { selectAllStratificationFactors } from './stratification-factors.selectors';

@Injectable()
export class StratificationFactorsEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private store$: Store<AppState>,
    private stratificationFactorsDataService: StratificationFactorsDataService
  ) {}

  fetchStratificationFactors$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StratificationFactorsActions.actionFetchStratificationFactors),
      withLatestFrom(this.store$.pipe(select(selectAllStratificationFactors))),
      switchMap(() =>
        this.stratificationFactorsDataService.fetchStratificationFactors().pipe(
          map((data: any) =>
            StratificationFactorsActions.actionFetchStratificationFactorsSuccess({
              stratificationFactors: data,
            })
          ),
          catchError(() => [StratificationFactorsActions.actionFetchStratificationFactorsFailure()])
        )
      )
    )
  );

  deleteStratificationFactor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StratificationFactorsActions.actionDeleteStratificationFactor),
      map((action) => action.factorId),
      filter((id) => !!id),
      switchMap((id) =>
        this.stratificationFactorsDataService.deleteStratificationFactor(id).pipe(
          map((data: any) => {
            this.router.navigate(['/home']);
            return StratificationFactorsActions.actionDeleteStratificationFactorSuccess({
              stratificationFactor: data[0],
            });
          }),
          catchError(() => [StratificationFactorsActions.actionDeleteStratificationFactorFailure()])
        )
      )
    )
  );
}
