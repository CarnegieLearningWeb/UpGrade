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
  data = [
    { factor: 'f1', summary: 'f1 summary' },
    { factor: 'f2', summary: 'f2 summary' },
    { factor: 'f3', summary: 'f3 summary' },
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.stratifications = this.data;
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
