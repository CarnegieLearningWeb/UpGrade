import { Component, ChangeDetectionStrategy, ViewChild, Inject, OnInit } from '@angular/core';
import {
  NewSegmentDialogData,
  NewSegmentDialogEvents,
  NewSegmentPaths,
  Segment,
} from '../../../../../../core/segments/store/segments.model';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-new-segment',
  templateUrl: './new-segment.component.html',
  styleUrls: ['./new-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSegmentComponent implements OnInit {
  @ViewChild('stepper', { static: false }) stepper: any;
  newSegmentData: any = {};
  segmentInfo: Segment;
  currentContext: string;
  isContextChanged = false;

  constructor(
    private dialogRef: MatDialogRef<NewSegmentComponent>,
    private segmentService: SegmentsService,
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

  getSegmentData(event: NewSegmentDialogData) {
    const { type, formData, path } = event;
    switch (type) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.onNoClick();
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
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
        if (path === NewSegmentPaths.SEGMENT_MEMBERS) {
          this.newSegmentData = { ...this.newSegmentData };
          this.segmentService.createNewSegment(this.newSegmentData);
          this.onNoClick();
        }
        break;
      case NewSegmentDialogEvents.UPDATE_SEGMENT:
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
