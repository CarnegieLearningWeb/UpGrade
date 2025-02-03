import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DeleteComponent {
  isDeleteButtonClicked: boolean;
  constructor(public dialogRef: MatDialogRef<DeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  onCancelClick(): void {
    this.isDeleteButtonClicked = false;
    this.dialogRef.close(this.isDeleteButtonClicked);
  }

  delete(): void {
    this.isDeleteButtonClicked = true;
    this.dialogRef.close(this.isDeleteButtonClicked);
  }
}
