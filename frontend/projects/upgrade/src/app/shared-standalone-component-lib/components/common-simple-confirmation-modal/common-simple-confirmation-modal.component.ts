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
import { CommonModalConfig, SimpleConfirmationModalParams } from '../common-modal/common-modal-config';

@Component({
  selector: 'common-simple-confirmation-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './common-simple-confirmation-modal.component.html',
  styleUrl: './common-simple-confirmation-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSimpleConfirmationModal{
  message: string = "";
  subMessage: string = "";
  subMessageColor: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<SimpleConfirmationModalParams>,
    public dialogRef: MatDialogRef<CommonSimpleConfirmationModal>
  ) {}

  onPrimaryActionBtnClicked() {
    this.dialogRef.close(true);
  }

  closeModal() {
    this.dialogRef.close(false);
  }
}