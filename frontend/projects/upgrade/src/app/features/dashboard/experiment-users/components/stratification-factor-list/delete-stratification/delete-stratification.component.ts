import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-delete-stratification',
  templateUrl: './delete-stratification.component.html',
  styleUrls: ['./delete-stratification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStratificationComponent {
  message: boolean;
  constructor(
    public dialogRef: MatDialogRef<DeleteStratificationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.message = false;
    this.dialogRef.close(this.message);
  }

  delete(): void {
    this.message = true;
    this.dialogRef.close(this.message);
  }
}
