import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentVM } from '../../../../../../core/segments/store/segments.model';

interface ImportSegmentJSON {
  schema: Record<keyof SegmentVM, string>,
  data: SegmentVM
}

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss']
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: SegmentVM;
  isSegmentJSONValid = true;

  constructor(
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegment() {
    this.isSegmentJSONValid = this.validateSegmentJSON(this.segmentInfo);
    if (this.isSegmentJSONValid) {
      this.segmentsService.importSegment({ ...this.segmentInfo });
      this.onCancelClick();
    }
  }

  uploadFile(event) {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      function() {
        const result = JSON.parse(reader.result as any);
        this.segmentInfo = result;
      }.bind(this)
    );
    reader.readAsText(event.target.files[0]);
  }

  private validateSegmentJSON(segment: SegmentVM) {
    const segmentSchema: Record<keyof any, string> = {
      id: 'string',
      name: 'string',
      context: 'string',
      description: 'string',
      userIds: 'array',
      groups: 'interface',
      subSegmentIds: 'array',
      type: 'enum'
    };

    const groupSchema: Record<keyof any, string> = {
      groupId: 'string',
      type: 'string',
    }

    let missingProperties = this.checkForMissingProperties({ schema: segmentSchema, data: segment });
    if (missingProperties.length > 0) {
      return false;
    } else {
      // segment.groups.map(group => {
      //   missingProperties = [ ...missingProperties, ...this.checkForMissingProperties({ schema: groupSchema, data: group })];
      // });
      return missingProperties.length === 0;
    }
  }

  private checkForMissingProperties(segmentJson: ImportSegmentJSON) {
    const { schema, data } = segmentJson;
    const missingProperties = Object.keys(schema)
      .filter(key => data[key] === undefined)
      .map(key => key as keyof (SegmentVM))
      .map(key => new Error(`Document is missing ${key} ${schema[key]}`));
      return missingProperties;
  }
}
