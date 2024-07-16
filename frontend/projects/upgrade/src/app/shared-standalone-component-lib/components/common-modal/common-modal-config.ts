import { MatDialogConfig } from '@angular/material/dialog';

export interface CommonModalConfig<ParamsType = unknown> {
  title: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
  primaryActionBtnColor?: string; // TODO mat-button enum? or just string?
  hideFooter?: boolean;
  params?: ParamsType;
}

export interface CommonDialogMatDialogConfig extends MatDialogConfig {
  data: CommonModalConfig;
}
