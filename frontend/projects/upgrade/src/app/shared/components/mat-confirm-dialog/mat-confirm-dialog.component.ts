import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
@Component({
  selector: 'app-mat-confirm-dialog',
  templateUrl: './mat-confirm-dialog.component.html',
  styleUrls: ['./mat-confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatConfirmDialogComponent {
  constructor(public dialogRef: MatDialogRef<MatConfirmDialogComponent>) {}
}
