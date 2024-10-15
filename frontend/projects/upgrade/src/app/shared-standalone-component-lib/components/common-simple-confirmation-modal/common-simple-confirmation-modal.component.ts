import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { CommonModalConfig, SimpleConfirmationModalParams } from '../common-modal/common-modal.types';

/**
 * CommonSimpleConfirmationModalComponent is a reusable modal component for simple confirmation dialogs.
 * It accepts a message, and an optional subMessage that can be also optionally be styled as 'info' or 'warn'.
 * It will emit a boolean to the onClose event, true if the primary action button is clicked, false otherwise (close or cancel clicked without confirm).
 *
 * Example usage:
 *
 * // In dialog service, create a config object with SimpleConfirmationModalParams
 * openExampleConfirmModel(someData: string) {
 *   const exampleConfig: CommonModalConfig<SimpleConfirmationModalParams> = {
 *     title: 'Confirm Choice',
 *     primaryActionBtnLabel: 'Confirm',
 *     primaryActionBtnColor: 'warn',
 *     cancelBtnLabel: 'Cancel',
 *     params: {
 *       message: 'Are you sure?',
 *       subMessage: `* This will send ${someData} somewhere.`,
 *       subMessageClass: 'warn',
 *     },
 *   };
 *
 *   return this.openSimpleCommonConfirmationModal(exampleConfig);
 * }
 *
 *  // Handle open and close in the component:
 *  this.exampleDialogRef = this.openEnableConfirmModel(someData);
 *
 *  // On primary click, confirmClicked will be true, otherwise false
 *  this.exampleDialogRef.afterClosed().subscribe((confirmClicked) => {
 *    if (confirmClicked) {
 *      // handle confirmed action
 *    } else {
 *      // handle cancel or do nothing
 *    }
 *  })
 *
 */
@Component({
  selector: 'common-simple-confirmation-modal',
  standalone: true,
  imports: [CommonModalComponent, MatDialogTitle, MatDialogContent, MatDialogClose, TranslateModule, CommonModule],
  templateUrl: './common-simple-confirmation-modal.component.html',
  styleUrl: './common-simple-confirmation-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSimpleConfirmationModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<SimpleConfirmationModalParams>,
    public dialogRef: MatDialogRef<CommonSimpleConfirmationModalComponent>
  ) {}

  onPrimaryActionBtnClicked() {
    this.dialogRef.close(true);
  }

  closeModal() {
    this.dialogRef.close(false);
  }
}
