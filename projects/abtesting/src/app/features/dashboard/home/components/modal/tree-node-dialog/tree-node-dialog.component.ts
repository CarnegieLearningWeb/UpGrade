import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-tree-node-dialog',
  templateUrl: './tree-node-dialog.component.html',
  styleUrls: ['./tree-node-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeNodeDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<TreeNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

    onCancelClick(): void {
    this.dialogRef.close();
  }
}
