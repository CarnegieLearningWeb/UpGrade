import { MatDialogConfig } from '@angular/material/dialog';

export interface CommonModalConfig {
  title: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
  primaryActionBtnColor?: string; // TODO mat-button enum? or just string?
  hideFooter?: boolean;
}

export interface CommonDialogMatDialogConfig extends MatDialogConfig {
  data: CommonModalConfig;
}
