import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ImportStratificationsComponent } from './import-stratifications/import-stratifications.component';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';
import { DeleteStratificationComponent } from './delete-stratification/delete-stratification.component';
import { StratificationFactor } from '../../../../../core/stratification-factors/store/stratification-factors.model';
import { Observable, Subscription } from 'rxjs';
import { StratificationFactorsService } from '../../../../../core/stratification-factors/stratification-factors.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { ExperimentNameVM } from '../../../../../core/experiments/store/experiments.model';
import { MatTableDataSource } from '@angular/material/table';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';

interface StratificationFactorsTableRow {
  factor: string;
  summary: string;
  isUsed: boolean;
  experimentIds: string[];
}

@Component({
  selector: 'users-stratification-factor-list',
  templateUrl: './stratification-factor-list.component.html',
  styleUrls: ['./stratification-factor-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class StratificationComponent implements OnInit {
  permissions$: Observable<UserPermission>;
  allStratificationFactors: StratificationFactor[];
  allStratificationFactorsSub: Subscription;
  isLoading$ = this.stratificationFactorsService.isLoading$;
  isFactorAddRequestSuccess$ = this.stratificationFactorsService.isFactorAddRequestSuccess$;
  stratificationFactorsForTable: MatTableDataSource<StratificationFactorsTableRow>;
  displayedColumns: string[] = ['factor', 'status', 'summary', 'actions'];
  allExperimentsName: ExperimentNameVM[];

  constructor(
    private dialog: MatDialog,
    private stratificationFactorsService: StratificationFactorsService,
    private experimentService: ExperimentService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.permissions$ = this.authService.userPermissions$;
    this.experimentService.allExperimentNames$.subscribe((allExperimentNames) => {
      this.allExperimentsName = allExperimentNames;
    });
    this.allStratificationFactorsSub = this.stratificationFactorsService.allStratificationFactors$.subscribe(
      (allStratificationFactors) => {
        this.allStratificationFactors = allStratificationFactors;
        this.updateTableData();
      }
    );
  }

  updateTableData() {
    this.stratificationFactorsForTable = new MatTableDataSource(this.convertToTableFormat());
    this.cdr.markForCheck();
  }

  convertToTableFormat() {
    const stratificationFactors: StratificationFactorsTableRow[] = this.allStratificationFactors.map(
      (stratificationFactor) => {
        let factorSummary = 'UUIDs';
        const allkeys = Object.keys(stratificationFactor.factorValue);
        let totalUsers = 0;
        let tempSummary: string;
        allkeys.forEach((key) => {
          tempSummary = tempSummary
            ? tempSummary + '; ' + key + '=' + stratificationFactor.factorValue[key]
            : key + '=' + stratificationFactor.factorValue[key];
          totalUsers += stratificationFactor.factorValue[key];
        });

        factorSummary = totalUsers.toString() + ' ' + factorSummary + ' (' + tempSummary + ')';

        const experimentNamesToShow = stratificationFactor.experimentIds.map((experimentId) => {
          return this.allExperimentsName.find((experiment) => experiment.id === experimentId)?.name;
        });
        return {
          factor: stratificationFactor.factor,
          summary: factorSummary,
          isUsed: this.checkStratificationFactorUsageStatus(stratificationFactor.experimentIds),
          experimentIds: experimentNamesToShow,
        };
      }
    );
    return stratificationFactors;
  }

  openImportStratificationsDialog() {
    const dialogRef = this.dialog.open(ImportStratificationsComponent, {
      panelClass: 'import-stratification-modal',
    });
    dialogRef.afterClosed().subscribe((isImportButtonClicked) => {
      if (isImportButtonClicked) {
        this.stratificationFactorsService.fetchStratificationFactors();
      }
    });
  }

  handleDownload(rowData) {
    // Add code of further actions after downloading strata factor details
    this.stratificationFactorsService.exportStratificationFactors(rowData.factor);
  }

  handleDelete(rowData) {
    const dialogRef = this.dialog.open(DeleteStratificationComponent, {
      panelClass: 'import-stratification-modal',
      data: { factor: cloneDeep(rowData.factor) },
    });

    dialogRef.afterClosed().subscribe((isDeleteButtonClicked) => {
      if (isDeleteButtonClicked) {
        this.stratificationFactorsService.deleteStratificationFactors(rowData.factor);
        // Add code of further actions after deleting strata factor details
        setTimeout(() => {
          this.stratificationFactorsService.fetchStratificationFactors();
        }, 1);
      }
    });
  }

  getExperimentIdsTooltip(experimentIds: any[]): string {
    return 'Experiments: [' + experimentIds?.join(', ') + ']';
  }

  checkStratificationFactorUsageStatus(experimentIds: string[]) {
    if (Array.isArray(experimentIds)) {
      return experimentIds.some((id) => id);
    }
    return false;
  }

  ngOnDestroy() {
    this.allStratificationFactorsSub.unsubscribe();
  }
}
