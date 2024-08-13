import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, filter, catchError, withLatestFrom } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { AppState } from '../../core.state';
import * as StratificationFactorsActions from './stratification-factors.actions';
import { StratificationFactorsDataService } from '../stratification-factors.data.service';
import { selectAllStratificationFactors } from './stratification-factors.selectors';
import { StratificationFactor, StratificationFactorDeleteResponse } from './stratification-factors.model';
import { NotificationService } from '../../core.module';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class StratificationFactorsEffects {
  constructor(
    private actions$: Actions,
    private router: Router,
    private store$: Store<AppState>,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private stratificationFactorsDataService: StratificationFactorsDataService
  ) {}

  fetchStratificationFactors$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StratificationFactorsActions.actionFetchStratificationFactors),
      withLatestFrom(this.store$.pipe(select(selectAllStratificationFactors))),
      switchMap(() =>
        this.stratificationFactorsDataService.fetchStratificationFactors().pipe(
          map((data: StratificationFactor[]) =>
            StratificationFactorsActions.actionFetchStratificationFactorsSuccess({
              stratificationFactors: data,
              isFactorAddRequestSuccess: false,
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
          map((data: StratificationFactorDeleteResponse) => {
            if (data) {
              this.notificationService.showSuccess(
                this.translate.instant('Stratification factor deleted successfully!')
              );
              const stratificationFactor = {
                ...data,
                factor: data.stratificationFactorName,
              };
              delete stratificationFactor.stratificationFactorName;
              const successResponse = StratificationFactorsActions.actionDeleteStratificationFactorSuccess({
                stratificationFactor: stratificationFactor,
              });
              this.router.navigate(['/participants']);
              return successResponse;
            } else {
              return StratificationFactorsActions.actionDeleteStratificationFactorFailure();
            }
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
          map(() => {
            this.notificationService.showSuccess(
              this.translate.instant('Stratification factor imported successfully!')
            );
            return StratificationFactorsActions.actionImportStratificationFactorSuccess({
              isFactorAddRequestSuccess: true,
            });
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
            this.notificationService.showSuccess(
              this.translate.instant('Stratification factor downloaded successfully!')
            );
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
    const factorName = firstRowColumns[1].replace(/["'\r]/g, '');
    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData); // data is the text response of the http request.
    hiddenElement.target = '_blank';
    hiddenElement.download = factorName + '.csv';
    hiddenElement.click();
  }
}
