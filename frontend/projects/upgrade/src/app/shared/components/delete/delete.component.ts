import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

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
