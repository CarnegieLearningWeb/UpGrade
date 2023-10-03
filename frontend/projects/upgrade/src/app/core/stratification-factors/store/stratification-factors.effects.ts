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
      map((action) => action.factor),
      filter((factor) => !!factor),
      switchMap((factor) =>
        this.stratificationFactorsDataService.deleteStratificationFactor(factor).pipe(
          map((data: any) => {
            this.router.navigate(['/participants']);
            const stratificationFactor = {
              ...data[0],
              factor: data[0].stratificationFactorName,
            };
            return StratificationFactorsActions.actionDeleteStratificationFactorSuccess({
              stratificationFactor: stratificationFactor,
            });
          }),
          catchError(() => [StratificationFactorsActions.actionDeleteStratificationFactorFailure()])
        )
      )
    )
  );

  importStratificationFactor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StratificationFactorsActions.actionImportStratificationFactor),
      map((action) => ({ csvData: action.csvData })),
      filter(({ csvData }) => !!csvData),
      switchMap(({ csvData }) =>
        this.stratificationFactorsDataService.importStratificationFactors(csvData).pipe(
          map((data) => {
            return StratificationFactorsActions.actionImportStratificationFactorSuccess();
          }),
          catchError(() => [StratificationFactorsActions.actionImportStratificationFactorFailure()])
        )
      )
    )
  );

  exportStratificationFactor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StratificationFactorsActions.actionExportStratificationFactor),
      map((action) => ({ factor: action.factor })),
      filter(({ factor }) => !!factor),
      switchMap(({ factor }) =>
        this.stratificationFactorsDataService.exportStratificationFactor(factor).pipe(
          map((data) => {
            this.download(data);
            return StratificationFactorsActions.actionExportStratificationFactorSuccess();
          }),
          catchError(() => [StratificationFactorsActions.actionExportStratificationFactorFailure()])
        )
      )
    )
  );

  private download(csvData) {
    const rows = csvData.trim().split('\n');
    const firstRowColumns = rows[0].split(',');

    // Access the second column of the first row
    const value = firstRowColumns[1].replace(/["']/g, '');
    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData); // data is the text response of the http request.
    hiddenElement.target = '_blank';
    hiddenElement.download = value + '.csv';
    hiddenElement.click();
  }
}
