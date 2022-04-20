import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-delete-segment',
  templateUrl: './delete-segment.component.html',
  styleUrls: ['./delete-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteSegmentComponent {
  flagName: string;
  constructor(
    public dialogRef: MatDialogRef<DeleteSegmentComponent>,
    private featureFlagService: FeatureFlagsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteSegment() {
    this.featureFlagService.deleteFeatureFlag(this.data.flagId);
    this.onCancelClick();
  }
}
