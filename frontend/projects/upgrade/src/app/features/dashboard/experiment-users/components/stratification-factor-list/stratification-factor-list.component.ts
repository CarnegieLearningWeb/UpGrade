import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ImportStratificationsComponent } from './import-stratifications/import-stratifications.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteStratificationComponent } from './delete-stratification/delete-stratification.component';
import { StratificationFactor } from '../../../../../core/stratification-factors/store/stratification-factors.model';
import { Subscription } from 'rxjs';
import { StratificationFactorsService } from '../../../../../core/stratification-factors/stratification-factors.service';
import { STRATIFICATION_FACTOR_STATUS } from '../../../../../../../../../../types/src/Experiment/enums';

interface StratificationFactorsTableRow {
  factor: string;
  summary: string;
  status: string;
  experimentIds: string[];
}

@Component({
  selector: 'users-stratification-factor-list',
  templateUrl: './stratification-factor-list.component.html',
  styleUrls: ['./stratification-factor-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StratificationComponent implements OnInit {
  allStratificationFactors: StratificationFactor[];
  allStratificationFactorsSub: Subscription;
  isLoadingStratificationFactors$ = this.stratificationFactorsService.isLoadingStratificationFactors$;
  stratificationFactorsForTable: StratificationFactorsTableRow[] = [];
  displayedColumns: string[] = ['factor', 'status', 'summary', 'actions'];

  constructor(private dialog: MatDialog, private stratificationFactorsService: StratificationFactorsService) {}

  ngOnInit(): void {
    this.allStratificationFactorsSub = this.stratificationFactorsService.allStratificationFactors$.subscribe(
      (allStratificationFactors) => {
        this.allStratificationFactors = allStratificationFactors;
        this.stratificationFactorsForTable = this.convertToTableFormat();
      }
    );
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
        const status =
          stratificationFactor.experimentIds[0] !== null
            ? STRATIFICATION_FACTOR_STATUS.USED
            : STRATIFICATION_FACTOR_STATUS.UNUSED;

        return {
          factor: stratificationFactor.factor,
          summary: factorSummary,
          status: status,
          experimentIds: stratificationFactor.experimentIds,
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
        setTimeout(() => {
          this.stratificationFactorsService.fetchStratificationFactors();
        }, 1);
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
      data: { factor: clonedeep(rowData.factor) },
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
    return 'Experiment IDs: [' + experimentIds.join(', ') + ']';
  }

  checkStratificationFactorUsageStatus(status: string): boolean {
    return status === STRATIFICATION_FACTOR_STATUS.USED ? true : false;
  }

  ngOnDestroy() {
    this.allStratificationFactorsSub.unsubscribe();
  }
}
