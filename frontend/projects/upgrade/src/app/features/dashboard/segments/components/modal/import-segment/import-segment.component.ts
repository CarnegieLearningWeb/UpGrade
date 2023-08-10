import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { TranslateService } from '@ngx-translate/core';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentInput, Segment } from '../../../../../../core/segments/store/segments.model';
import { MatTableDataSource } from '@angular/material/table';

interface ImportSegmentJSON {
  schema: Record<keyof SegmentInput, string>;
  data: SegmentInput;
}

@Component({
  selector: 'app-import-segment',
  templateUrl: './import-segment.component.html',
  styleUrls: ['./import-segment.component.scss'],
})
export class ImportSegmentComponent {
  file: any;
  segmentInfo: Segment;
  isSegmentJSONValid = true;
  segmentTemp: SegmentInput;
  allSegments: SegmentInput[] = [];
  segmentJSONVersionStatus = 0;
  missingAllProperties: string;
  importFileErrorsDataSource = new MatTableDataSource<{ filename: string; error: string }>();
  importFileErrors: { filename: string; error: string }[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];
  uploadedFileCount = 0;

  constructor(
    private segmentsService: SegmentsService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<ImportSegmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegment() {
    // TODO: improve the logic here
    if (this.importFileErrors.length === 0) {
      this.segmentsService.importSegment(this.allSegments);
      this.onCancelClick();
    }
  }

  uploadFile(event) {
    let index = 0;
    let fileName = '';
    const reader = new FileReader();
    this.uploadedFileCount = event.target.files.length;
    this.importFileErrors = [];

    reader.addEventListener(
      'load',
      async function () {
        const result = JSON.parse(reader.result as any);
        this.segmentInfo = result;
        this.importFileErrorsDataSource.data = await this.validateSegment(this.segmentInfo, fileName);
        readFile(++index);
      }.bind(this)
    );

    readFile(index);
    function readFile(fileIndex: number) {
      if (fileIndex >= event.target.files.length) return;
      fileName = event.target.files[fileIndex].name;
      reader.readAsText(event.target.files[fileIndex]);
    }
  }

  async validateSegment(segmentInfo: Segment, fileName) {
    const userIds = segmentInfo.individualForSegment.map((individual) =>
      individual.userId ? individual.userId : undefined
    );
    const subSegmentIds = segmentInfo.subSegments.map((subSegment) => (subSegment.id ? subSegment.id : undefined));
    const groups = segmentInfo.groupForSegment.map((group) => {
      return group.type && group.groupId ? { type: group.type, groupId: group.groupId } : null;
    });

    this.segmentTemp = { ...this.segmentInfo, userIds: userIds, subSegmentIds: subSegmentIds, groups: groups };
    this.isSegmentJSONValid = this.validateSegmentJSON(this.segmentTemp);
    if (this.isSegmentJSONValid) {
      this.allSegments.push(this.segmentTemp);
    } else {
      this.importFileErrors.push({
        filename: fileName,
        error: this.translate.instant('segments.import-segment.error.message.text') + ' ' + this.missingAllProperties,
      });
      this.allSegments.push(this.segmentTemp);
    }
    return this.importFileErrors;
  }

  validateSegmentJSON(segment: SegmentInput): boolean {
    const segmentSchema: Record<keyof any, string> = {
      id: 'string',
      name: 'string',
      context: 'string',
      description: 'string',
      userIds: 'array',
      groups: 'interface',
      subSegmentIds: 'array',
      type: 'enum',
    };

    // const groupSchema: Record<keyof any, string> = {
    //   groupId: 'string',
    //   type: 'string',
    // }

    this.missingAllProperties = this.checkForMissingProperties({ schema: segmentSchema, data: segment });

    if (this.missingAllProperties.length > 0) {
      return false;
    } else {
      // segment.groups.map(group => {
      //   missingAllProperties = [ ...missingAllProperties, ...this.checkForMissingProperties({ schema: groupSchema, data: group })];
      // });
      return this.missingAllProperties.length === 0;
    }
  }

  private checkForMissingProperties(segmentJson: ImportSegmentJSON) {
    const { schema, data } = segmentJson;
    const missingProperties = Object.keys(schema)
      .filter((key) => data[key] === undefined)
      .map((key) => key as keyof SegmentInput)
      .map((key) => `${key}`);
    return missingProperties.join(', ');
  }
}
