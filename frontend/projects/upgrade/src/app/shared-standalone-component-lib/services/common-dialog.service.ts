import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';
import { CommonDialogMatDialogConfig, EXAMPLE_DIALOG_CONFIG } from '../components/common-dialog/common-dialog-config';
import { ExampleProjectedContentComponent } from '../components/example-projected-content/example-projected-content.component';

@Injectable({
  providedIn: 'root',
})
export class CommonDialogService {
  constructor(private dialog: MatDialog) {}

  private openCommonDialog(config: CommonDialogMatDialogConfig) {
    return this.dialog.open(CommonDialogComponent, { ...config });
  }

  openCommonProjectedDialog() {
    return this.dialog.open(ExampleProjectedContentComponent, EXAMPLE_DIALOG_CONFIG);
  }

  openExampleDialog() {
    return this.openCommonDialog(EXAMPLE_DIALOG_CONFIG);
  }
}
