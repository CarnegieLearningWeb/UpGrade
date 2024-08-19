import { MatDialogConfig } from '@angular/material/dialog';

export interface CommonModalConfig<ParamsType = unknown> {
  title: string;
  nameHint?: string;
  tagsLabel?: string;
  tagsPlaceholder?: string;
  valuesLabel?: string;
  valuesPlaceholder?: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
  primaryActionBtnColor?: string;
  hideFooter?: boolean;
  params?: ParamsType;
}

export interface CommonDialogMatDialogConfig extends MatDialogConfig {
  data: CommonModalConfig;
}

export interface SimpleConfirmationModalParams {
  message: string;
  subMessage?: string;
  subMessageClass?: 'info' | 'warn';
}

export enum ModalSize {
  SMALL = '480px',
  MEDIUM = '560px',
  STANDARD = '656px',
  LARGE = '864px',
}
