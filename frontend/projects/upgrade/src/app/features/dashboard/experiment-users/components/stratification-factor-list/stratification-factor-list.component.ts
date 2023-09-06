import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ImportStratificationsComponent } from './import-stratifications/import-stratifications.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import * as clonedeep from 'lodash.clonedeep';
import { DeleteStratificationComponent } from './delete-stratification/delete-stratification.component';

@Component({
  selector: 'users-stratification-factor-list',
  templateUrl: './stratification-factor-list.component.html',
  styleUrls: ['./stratification-factor-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StratificationComponent implements OnInit {
  isLoadingStratifications$ = false;
  stratifications: { factor: string; summary: string }[] = [];
  displayedColumns: string[] = ['factor', 'summary', 'actions'];
  // data = [
  //   { factor: 'f1', summary: 'f1 summary' },
  //   { factor: 'f2', summary: 'f2 summary' },
  //   { factor: 'f3', summary: 'f3 summary' },
  // ];
  dataSource = [
    {
      factorId: '9bdf13e6-42c7-4f0b-9c9e-0c935219208c',
      factor: 'factor1',
      value: {
        yes: 100,
        no: 50,
      },
      nonApplicable: 50,
    },
    {
      factorId: '15811fae-f0dc-4dbc-a798-40f7bdc589cc',
      factor: 'factor2',
      value: {
        yes: 75,
        no: 50,
      },
      nonApplicable: 25,
    },
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.stratifications = this.convertToTableformat();
  }

  convertToTableformat() {
    const stratificationFactors = this.dataSource.map((element) => {
      let factorSummary = 'UUIDs';
      const allkeys = Object.keys(element.value);
      let totalUsers = 0;
      let tempSummary: string;
      allkeys.forEach((key) => {
        tempSummary = tempSummary
          ? tempSummary + '; ' + key + '=' + element.value[key]
          : key + '=' + element.value[key];
        totalUsers += element.value[key];
      });
      tempSummary = tempSummary ? tempSummary + '; N/A=' + element.nonApplicable : 'N/A=' + element.nonApplicable;
      totalUsers += element.nonApplicable;
      factorSummary = totalUsers.toString() + ' ' + factorSummary + ' (' + tempSummary + ')';
      return { factor: element.factor, summary: factorSummary };
    });
    return stratificationFactors;
  }

  openImportStratificationsDialog() {
    this.dialog.open(ImportStratificationsComponent, {
      panelClass: 'import-stratification-modal',
    });
  }

  handleDownload(rowData, rowIndex) {
    console.log('handle download:' + rowIndex);
    console.log(rowData);
    // Add code of further actions after downloading strata factor details
  }

  handleDelete(rowData, rowIndex) {
    console.log(rowData);
    const dialogRef = this.dialog.open(DeleteStratificationComponent, {
      panelClass: 'import-stratification-modal',
      data: { factor: clonedeep(rowData.factor) },
    });

    dialogRef.afterClosed().subscribe((isDeleteButtonClicked) => {
      if (isDeleteButtonClicked) {
        console.log('handle delete:' + rowIndex);
        // Add code of further actions after deleting strata factor details
      }
    });
  }
}
