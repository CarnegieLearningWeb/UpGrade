import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteComponent {
  isDeleteButtonClicked: string;
  message: boolean;
  constructor(public dialogRef: MatDialogRef<DeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  onCancelClick(): void {
    this.message = false;
    this.dialogRef.close(this.message);
  }

  delete(): void {
    this.message = true;
    this.dialogRef.close(this.message);
  }
}
