import { MatDialogConfig } from '@angular/material/dialog';

export interface CommonModalConfig<ParamsType = unknown> {
  title: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
  primaryActionBtnColor?: string;
  hideFooter?: boolean;
  params?: ParamsType;
}

export interface SimpleConfirmationDialogTemplateParams {
  message: string;
  subMessage?: string;
  subMessageColor?: string;
}

export interface CommonDialogMatDialogConfig extends MatDialogConfig {
  data: CommonModalConfig;
}

export interface SimpleConfirmationModalParams {
  message: string;
  subMessage?: string;
  subMessageColor?: string;
}
