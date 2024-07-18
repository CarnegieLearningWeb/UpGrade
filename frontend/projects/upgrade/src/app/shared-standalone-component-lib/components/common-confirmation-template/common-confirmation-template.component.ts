import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { CommonModalComponent } from '../common-modal/common-modal.component';
import { CommonModalConfig, SimpleConfirmationDialogTemplateParams } from '../common-modal/common-modal-config';

@Component({
  selector: 'common-confirmation-template',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './common-confirmation-template.component.html',
  styleUrl: './common-confirmation-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonConfirmationDialogTemplate{
  message: string = "";
  subMessage: string = "";
  subMessageColor: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig<SimpleConfirmationDialogTemplateParams>,
    public dialogRef: MatDialogRef<CommonConfirmationDialogTemplate>
  ) {}

  onPrimaryActionBtnClicked() {
    this.dialogRef.close(true);
  }

  closeModal() {
    this.dialogRef.close(false);
  }
}
