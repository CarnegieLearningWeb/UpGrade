import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ImportStratificationsComponent } from './import-stratifications/import-stratifications.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

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
      panelClass: 'import-segment-modal',
    });
  }

  handleDownload(rowData, rowIndex) {
    console.log('handle download:' + rowIndex);
    console.log(rowData);
  }

  handleDelete(rowIndex) {
    console.log('handle delete:' + rowIndex);
  }
}
