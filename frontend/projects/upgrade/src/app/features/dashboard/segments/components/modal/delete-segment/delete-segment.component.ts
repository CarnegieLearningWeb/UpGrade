import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-delete-segment',
  templateUrl: './delete-segment.component.html',
  styleUrls: ['./delete-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteSegmentComponent {
  segmentName: string;
  constructor(
    public dialogRef: MatDialogRef<DeleteSegmentComponent>,
    private segmentsService: SegmentsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  deleteSegment() {
    this.segmentsService.deleteSegment(this.data.segmentId);
    this.onCancelClick();
  }
}
