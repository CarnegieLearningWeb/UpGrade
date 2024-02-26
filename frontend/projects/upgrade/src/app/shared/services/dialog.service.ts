import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatConfirmDialogComponent } from '../components/mat-confirm-dialog/mat-confirm-dialog.component';
import { GeneralFormDialogComponent } from '../standalone-components/general-form-dialog/general-form-dialog.component';
import { TestgDialogFormComponent } from '../standalone-components/general-form-dialog-templates/testg-dialog-form/testg-dialog-form.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openConfirmDialog() {
    return this.dialog.open(MatConfirmDialogComponent, {
      width: 'auto',
      disableClose: true,
    });
  }

  openTestDialog() {
    // in real usage, we probably want to pass return the dialog ref to the component so it can subscribe to the result
    const dialogRef = this.dialog.open(GeneralFormDialogComponent, {
      data: {
        title: 'Test Title',
        cancelBtnLabel: 'Test Cancel',
        primaryActionBtnLabel: 'Test Save',
        formComponent: TestgDialogFormComponent,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }
}
