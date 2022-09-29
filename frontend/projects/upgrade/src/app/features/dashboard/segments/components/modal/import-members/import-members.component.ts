import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentInput, Segment } from '../../../../../../core/segments/store/segments.model';
import { SegmentMembersComponent } from '../../segment-members/segment-members.component'

interface ImportSegmentJSON {
  schema: Record<keyof SegmentInput, string>,
  data: SegmentInput
}

@Component({
  selector: 'app-import-members',
  templateUrl: './import-members.component.html',
  styleUrls: ['./import-members.component.scss']
})
export class ImportMembersComponent {
  file: any;
  self: any;
  importData: string[][];
  isSegmentJSONValid = true;
  segmentTemp: SegmentInput;
  constructor(
    private segmentsService: SegmentsService,
    public dialogRef: MatDialogRef<ImportMembersComponent>,
    public segmentMembersComponent: SegmentMembersComponent,
    
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {this.self = this}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegment() {
    this.self.onCancelClick();
    this.self.segmentMembersComponent.addImportMembersData(this.self.importData);
  }

  uploadFile(event) {
    const reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    console.log("data: ", reader.result)
    reader.onload = (e) => {
      let csv: string = reader.result.toString();
      let allTextLines = csv.split(/\r|\n|\r/);
      let headers = allTextLines[0].split(',');
      let lines = [];

      for (let i = 1; i < allTextLines.length; i++) {
        // split content based on comma
        let data = allTextLines[i].split(',');
        if (data.length === headers.length) {
          let tarr = [];
          for (let j = 0; j < headers.length; j++) {
            tarr.push(data[j]);
          }
          // log each row to see output 
          console.log(tarr);
          lines.push(tarr);
        }
      }
      // all rows in the csv file 
      console.log(">>>>>>>>>>>>>>>>>", lines);
      this.importData = lines;
      // csv to json:
      // const result = csvToJSON(lines);
      // this.segmentInfo = result;
    }
  }

  private validateCSV(headers: string[]): boolean{
    //TODO complete validations
    return (headers.length === 2);
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

    // const groupSchema: Record<keyof any, string> = {
    //   groupId: 'string',
    //   type: 'string',
    // }

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
