import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-duplicate-segment',
  templateUrl: './duplicate-segment.component.html',
  styleUrls: ['./duplicate-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateSegmentComponent {
  segmentName: string;
  segmentDescription: string;

  constructor(
    public dialogRef: MatDialogRef<DuplicateSegmentComponent>,
    private segmentsService: SegmentsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.segmentName = this.data.segment.name + ' 2';
    this.segmentDescription = '(Copy) ' + this.data.segment.description;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onDuplicateClick(segmentName: string, segmentDescription: string) {
    const duplicateSegmentData = { ...this.data.segment, name: segmentName, description: segmentDescription, id: null };

    duplicateSegmentData.userIds = duplicateSegmentData.individualForSegment.map((individual) => individual.userId);
    duplicateSegmentData.subSegmentIds = duplicateSegmentData.subSegments.map((subSegment) => subSegment.id);
    duplicateSegmentData.groups = duplicateSegmentData.groupForSegment.map((group) => ({
      type: group.type,
      groupId: group.groupId,
    }));

    this.segmentsService.createNewSegment(duplicateSegmentData);
    this.onCancelClick();
  }
}
