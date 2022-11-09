import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-delete-flag',
  templateUrl: './delete-flag.component.html',
  styleUrls: ['./delete-flag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFlagComponent {
  flagName: string;
  constructor(
    public dialogRef: MatDialogRef<DeleteFlagComponent>,
    private featureFlagService: FeatureFlagsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteFlag() {
    this.featureFlagService.deleteFeatureFlag(this.data.flagId);
    this.onCancelClick();
  }
}
