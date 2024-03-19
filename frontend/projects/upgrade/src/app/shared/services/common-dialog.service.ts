import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';
import { CommonDialogMatDialogConfig, EXAMPLE_DIALOG_CONFIG } from '../components/common-dialog/common-dialog-config';

@Injectable({
  providedIn: 'root',
})
export class CommonDialogService {
  constructor(private dialog: MatDialog) {}

  private openCommonDialog(config: CommonDialogMatDialogConfig) {
    return this.dialog.open(CommonDialogComponent, { ...config });
  }

  openExampleDialog() {
    return this.openCommonDialog(EXAMPLE_DIALOG_CONFIG);
  }
}
