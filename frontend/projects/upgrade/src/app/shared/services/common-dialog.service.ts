import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonFormDialogComponent } from '../components/common-form-dialog/common-form-dialog.component';
import { ExampleDialogFormTemplateComponent } from '../components/common-form-dialog/example-dialog-form-template/example-dialog-form.component';

@Injectable({
  providedIn: 'root',
})
export class CommonDialogService {
  constructor(private dialog: MatDialog) {}

  openExampleDialog() {
    // returns the dialog ref to the caller component so it can subscribe to the result
    return this.dialog.open(CommonFormDialogComponent, {
      data: {
        title: 'Example Title',
        cancelBtnLabel: 'Cancel',
        primaryActionBtnLabel: 'Save',
        formComponent: ExampleDialogFormTemplateComponent, // change this to test different form modal templates
      },
      disableClose: true, // prevents closing the dialog by clicking outside of it
    });
  }
}
