import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

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
    private segmentsService: SegmentsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteSegment() {
    this.segmentsService.deleteSegment(this.data.segmentId);
    this.onCancelClick();
  }
}
