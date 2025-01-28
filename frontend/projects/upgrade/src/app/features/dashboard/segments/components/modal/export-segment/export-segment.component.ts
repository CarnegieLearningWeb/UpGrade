import { Component, ChangeDetectionStrategy, OnInit, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import JSZip from 'jszip';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { EXPORT_SEGMENT_METHOD, Segment, SegmentFile } from '../../../../../../core/segments/store/segments.model';
import { SegmentsService } from '../../../../../../core/segments/segments.service';

@Component({
    selector: 'app-export-segment',
    templateUrl: './export-segment.component.html',
    styleUrls: ['./export-segment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExportSegmentComponent implements OnInit {
  exportMethod = [{ value: EXPORT_SEGMENT_METHOD.JSON }, { value: EXPORT_SEGMENT_METHOD.CSV }];
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

  exportSegmentCSV(segmentIds: string[]) {
    let segmentData: SegmentFile[] = [];
    this.segmentsService.exportSegmentCSV(segmentIds).subscribe((response) => {
      segmentData = response;
      if (segmentData) {
        if (segmentData.length > 1) {
          const zip = new JSZip();
          segmentData.forEach((segment) => {
            zip.file(segment.fileName + '.csv', segment.fileContent);
          });
          zip.generateAsync({ type: 'base64' }).then((content) => {
            this.download('Segments.zip', content, true);
          });
        } else {
          this.download(segmentData[0].fileName, segmentData[0].fileContent, false);
        }
      }
    });
  }

  exportSegmentJson(segmentIds: string[]) {
    this.segmentsService.exportSegments(segmentIds);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  private download(filename, content, isZip: boolean) {
    const element = document.createElement('a');
    isZip
      ? element.setAttribute('href', 'data:application/zip;base64,' + content)
      : element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURI(content));
    element.target = '_blank';
    element.download = filename;
    element.click();
  }

  exportSegment() {
    const { exportMethod } = this.exportForm.value;
    const segmentIds = this.segments.map((segment) => segment.id);
    if (exportMethod === EXPORT_SEGMENT_METHOD.CSV) {
      this.exportSegmentCSV(segmentIds);
    } else if (exportMethod === EXPORT_SEGMENT_METHOD.JSON) {
      this.exportSegmentJson(segmentIds);
    }
    this.dialogRef.close();
  }
}
