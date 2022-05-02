import { Component, ChangeDetectionStrategy, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-duplicate-segment',
  templateUrl: './duplicate-segment.component.html',
  styleUrls: ['./duplicate-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateSegmentComponent implements OnInit{

  segmentData;
  constructor(
    public dialogRef: MatDialogRef<DuplicateSegmentComponent>,
    private segmentsService: SegmentsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.segmentData = this.data;
  }
  onCancelClick(): void {
    this.dialogRef.close();
  }
  
  onDuplicateClick(segmentName: string, segmentDescription: string) {
    console.log(' the segment info for duplicate dialogue ', segmentName, segmentDescription);
    // this.segmentsService.createNewSegment(this.data);
  }
}
