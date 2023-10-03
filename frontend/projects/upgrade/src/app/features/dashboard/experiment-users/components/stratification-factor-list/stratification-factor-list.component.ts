import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ImportStratificationsComponent } from './import-stratifications/import-stratifications.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteStratificationComponent } from './delete-stratification/delete-stratification.component';
import { StratificationFactor } from '../../../../../core/stratification-factors/store/stratification-factors.model';
import { Subscription } from 'rxjs';
import { StratificationFactorsService } from '../../../../../core/stratification-factors/stratification-factors.service';

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
  stratificationFactorsForTable: { factor: string; summary: string }[] = [];
  displayedColumns: string[] = ['factor', 'summary', 'actions'];

  constructor(private dialog: MatDialog, private stratificationFactorsService: StratificationFactorsService) {}

  ngOnInit(): void {
    this.allStratificationFactorsSub = this.stratificationFactorsService.allStratificationFactors$.subscribe(
      (allStratificationFactors) => {
        this.allStratificationFactors = allStratificationFactors;
        this.stratificationFactorsForTable = this.convertToTableformat();
      }
    );
  }

  convertToTableformat() {
    const stratificationFactors = this.allStratificationFactors.map((element) => {
      let factorSummary = 'UUIDs';
      const allkeys = Object.keys(element.values);
      let totalUsers = 0;
      let tempSummary: string;
      allkeys.forEach((key) => {
        tempSummary = tempSummary
          ? tempSummary + '; ' + key + '=' + element.values[key]
          : key + '=' + element.values[key];
        totalUsers += element.values[key];
      });
      factorSummary = totalUsers.toString() + ' ' + factorSummary + ' (' + tempSummary + ')';
      return { factor: element.factor, summary: factorSummary };
    });
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

  ngOnDestroy() {
    this.allStratificationFactorsSub.unsubscribe();
  }
}
