import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GeneralFormDialogComponent } from './standalone-components/general-form-dialog/general-form-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TestgDialogFormComponent } from './standalone-components/general-form-dialog-templates/testg-dialog-form/testg-dialog-form.component';
import { CreateFeatureFlagDialogFormComponent } from './standalone-components/general-form-dialog-templates/create-feature-flag-dialog-form/create-feature-flag-dialog-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GeneralFormDialogComponent, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // change this to test different form modal templates
  generalDialogFormParams = {
    title: 'Test Title',
    cancelBtnLabel: 'Test Cancel',
    primaryActionBtnLabel: 'Test Save',
    formComponent: TestgDialogFormComponent,
  };

  constructor(public dialog: MatDialog) {}

  // in a service, each would open a different dialog
  openDialog() {
    const dialogRef = this.dialog.open(GeneralFormDialogComponent, {
      data: this.generalDialogFormParams,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result);
    });
  }
}
