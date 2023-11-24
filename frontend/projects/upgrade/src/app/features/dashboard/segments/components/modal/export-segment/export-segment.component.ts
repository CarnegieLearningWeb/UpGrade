import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { first } from 'rxjs/operators';
import { EXPORT_METHOD } from 'upgrade_types';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { Segment } from '../../../../../../core/segments/store/segments.model';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
  selector: 'app-export-segment',
  templateUrl: './export-segment.component.html',
  styleUrls: ['./export-segment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportSegmentComponent implements OnInit {
  exportMethod = [{ value: EXPORT_METHOD.DESIGN }, { value: EXPORT_METHOD.DATA }];
  emailId: string;
  exportForm: UntypedFormGroup;
  segments: Segment[];

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private authService: AuthService,
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<ExportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.segments = this.data.segment;
  }

  ngOnInit(): void {
    this.exportForm = this._formBuilder.group({
      exportMethod: [{ value: '' }, Validators.required],
      emailId: '',
    });
    this.authService.currentUser$.pipe(first()).subscribe((userInfo) => {
      if (userInfo.email) {
        this.emailId = userInfo.email;
      }
    });
  }

  exportSegmentCSV(segmentId: string) {
    this.segmentsService.exportSegmentCSV(segmentId);
  }
  exportSegmentJson(segmentIds: string[]) {
    this.segmentsService.exportSegments(segmentIds);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  exportSegment() {
    const { exportMethod } = this.exportForm.value;
    if (exportMethod === EXPORT_METHOD.DATA && this.segments[0]) {
      this.exportSegmentCSV(this.segments[0].id);
    } else if (exportMethod === EXPORT_METHOD.DESIGN) {
      const segmentIds = this.segments.map((segment) => segment.id);
      this.exportSegmentJson(segmentIds);
    }
    this.onCancelClick();
  }
}
