import { MatDialogConfig } from '@angular/material/dialog';
import { ExampleDialogFormTemplateComponent } from './example-dialog-form-template/example-dialog-form.component';

export interface CommonDialogConfig {
  childContentComponent?: any; // TODO type this
  title: string;
  cancelBtnLabel?: string;
  primaryActionBtnLabel?: string;
  primaryActionBtnColor?: string; // TODO mat-button enum? or just string?
  hideFooter?: boolean;
}

export interface CommonDialogMatDialogConfig extends MatDialogConfig {
  data: CommonDialogConfig;
}

export const BASE_DIALOG_CONFIG_DEFAULTS: CommonDialogMatDialogConfig = {
  // ------ COMMON_DIALOG_CONFIG------
  // custom data that gets injected into the constructor of the dialog component
  data: {
    title: 'title', // or just don't let it be empty
    cancelBtnLabel: 'Cancel', // TODO make these translation template strings
    primaryActionBtnLabel: 'Submit',
    primaryActionBtnColor: 'primary',
    hideFooter: false,
  },

  // ------ MAT_DIALOG_CONFIG ------
  // https://material.angular.io/components/dialog/overview
  width: '720px', // TODO
  height: '500px', // TODO
  disableClose: true,
};

// anything that's specific to most form dialogs
export const FORM_DIALOG_DEFAULT_CONFIG = {
  ...BASE_DIALOG_CONFIG_DEFAULTS,
};

// anything that's specific to most confirm dialogs
export const CONFIRM_DIALOG_DEFAULT_CONFIG = {
  ...BASE_DIALOG_CONFIG_DEFAULTS,
};

// anything that's specific to most info dialogs
export const INFO_DIALOG_DEFAULT_CONFIG = {
  ...BASE_DIALOG_CONFIG_DEFAULTS,
  hideFooter: true,
};

export const EXAMPLE_DIALOG_CONFIG: CommonDialogMatDialogConfig = {
  ...FORM_DIALOG_DEFAULT_CONFIG,
  data: {
    title: 'Example Dialog',
    cancelBtnLabel: 'Close',
    primaryActionBtnLabel: 'Done',
    childContentComponent: ExampleDialogFormTemplateComponent,
  },
};
