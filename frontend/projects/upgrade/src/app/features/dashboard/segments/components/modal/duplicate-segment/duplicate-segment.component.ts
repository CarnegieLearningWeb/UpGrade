import { Component, ChangeDetectionStrategy, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentInput } from '../../../../../../core/segments/store/segments.model';

@Component({
  selector: 'app-duplicate-segment',
  templateUrl: './duplicate-segment.component.html',
  styleUrls: ['./duplicate-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateSegmentComponent {

  segmentName;
  segmentDescription;

  constructor(
    public dialogRef: MatDialogRef<DuplicateSegmentComponent>,
    private segmentsService: SegmentsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    this.segmentName = this.data.segment.name + ' 2';
    this.segmentDescription =  '(Copy) ' + this.data.segment.description;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onDuplicateClick(segmentName: string, segmentDescription: string) {
    const newSegment: any =  { ...this.data.segment, name: segmentName, description: segmentDescription, id: null };
    
    newSegment.userIds = newSegment.individualForSegment.map((i) => {
      return i.userId;
    });
    newSegment.subSegmentIds = newSegment.subSegments.map((i) => {
      return i.id;
    });
    newSegment.groups = newSegment.groupForSegment.map((i) => {
      return { type: i.type, groupId: i.groupId } ;
    });

    this.segmentsService.createNewSegment(newSegment);
    this.onCancelClick();
  }
}
