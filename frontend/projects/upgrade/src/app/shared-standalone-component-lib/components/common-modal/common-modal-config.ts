import { environment } from '../../../../environments/environment';

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
  subMessageClass?: 'info' | 'warn';
}

// see close-modal.interceptor.ts
export const ENDPOINTS_TO_INTERCEPT_FOR_MODAL_CLOSE = [
  environment.api.addFlagInclusionList,
  environment.api.addFlagExclusionList,
];

