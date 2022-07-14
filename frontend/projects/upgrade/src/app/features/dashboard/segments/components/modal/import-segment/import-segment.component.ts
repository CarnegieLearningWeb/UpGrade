import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentInput, Segment } from '../../../../../../core/segments/store/segments.model';

interface ImportSegmentJSON {
  schema: Record<keyof SegmentInput, string>,
  data: SegmentInput
}

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss']
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: Segment;
  isSegmentJSONValid = true;
  segmentTemp: SegmentInput;
  constructor(
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegment() {
    // TODO: improve the logic here 
    let { individualForSegment, groupForSegment, subSegments, ...rest } = this.segmentInfo;
  
    const userIds = this.segmentInfo.individualForSegment.map((individual) => {
      return individual.userId;
    });
    const subSegmentIds = this.segmentInfo.subSegments.map((subSegment) => {
      return subSegment.id;
    });
    const groups = this.segmentInfo.groupForSegment.map((group) => {
      return { type: group.type, groupId: group.groupId } ;
    });
    
    this.segmentTemp = {...rest, userIds: userIds, subSegmentIds: subSegmentIds, groups: groups};
    this.isSegmentJSONValid = this.validateSegmentJSON(this.segmentTemp);
    if (this.isSegmentJSONValid) {
      this.segmentsService.importSegment({ ...this.segmentTemp });
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

  private validateSegmentJSON(segment: SegmentInput) {
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
      .map(key => key as keyof (SegmentInput))
      .map(key => new Error(`Document is missing ${key} ${schema[key]}`));
      return missingProperties;
  }
}
