import { Component, ChangeDetectionStrategy, ViewChild, Inject, OnInit } from '@angular/core';
import {
  NewSegmentDialogData_LEGACY,
  NewSegmentDialogEvents_LEGACY,
  NewSegmentPaths_LEGACY,
  Segment_LEGACY,
} from '../../../../../../core/segments_LEGACY/store/segments.model._LEGACY';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { SegmentsService_LEGACY } from '../../../../../../core/segments_LEGACY/segments.service._LEGACY';

@Component({
  selector: 'app-new-segment',
  templateUrl: './new-segment.component.html',
  styleUrls: ['./new-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NewSegmentComponent implements OnInit {
  @ViewChild('stepper', { static: false }) stepper: any;
  newSegmentData: any = {};
  segmentInfo: Segment_LEGACY;
  currentContext: string;
  isContextChanged = false;

  constructor(
    private dialogRef: MatDialogRef<NewSegmentComponent>,
    private segmentService: SegmentsService_LEGACY,
    private experimentService: ExperimentService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.segmentInfo = this.data.segmentInfo;
    }
  }

  ngOnInit() {
    this.experimentService.fetchContextMetaData();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getSegmentData(event: NewSegmentDialogData_LEGACY) {
    const { type, formData, path } = event;
    switch (type) {
      case NewSegmentDialogEvents_LEGACY.CLOSE_DIALOG:
        this.onNoClick();
        break;
      case NewSegmentDialogEvents_LEGACY.SEND_FORM_DATA:
        this.newSegmentData = {
          ...this.newSegmentData,
          ...formData,
        };
        if (!this.currentContext && this.segmentInfo) {
          this.currentContext = this.segmentInfo.context;
        }

        this.isContextChanged = this.currentContext ? this.currentContext !== this.newSegmentData.context : false;
        this.currentContext = this.newSegmentData.context;

        this.stepper.next();
        if (path === NewSegmentPaths_LEGACY.SEGMENT_MEMBERS) {
          this.newSegmentData = { ...this.newSegmentData };
          this.segmentService.createNewSegment(this.newSegmentData);
          this.onNoClick();
        }
        break;
      case NewSegmentDialogEvents_LEGACY.UPDATE_SEGMENT:
        this.newSegmentData = {
          ...this.segmentInfo,
          ...this.newSegmentData,
          ...formData,
        };
        this.segmentService.updateSegment(this.newSegmentData);
        this.onNoClick();
        break;
    }
  }
}
