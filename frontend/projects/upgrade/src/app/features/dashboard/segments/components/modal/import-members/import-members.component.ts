import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-import-members',
  templateUrl: './import-members.component.html',
  styleUrls: ['./import-members.component.scss']
})
export class ImportMembersComponent {
  isMembersCSVValid: boolean = true;
  importData: string[][];
  isSegmentJSONValid = true;
  constructor(
    public dialogRef: MatDialogRef<ImportMembersComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importSegment() {
    this.dialogRef.close(this.importData);
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

      this.isMembersCSVValid = this.validateCSV(headers, allTextLines)

      for (let i = 1; i < allTextLines.length; i++) {
        // split content based on comma
        let data = allTextLines[i].split(',');
        if (data.length === headers.length) {
          let member = [];
          for (let j = 0; j < headers.length; j++) {
            member.push(data[j]);
          }
          lines.push(member);
        }
      }
      this.importData = lines;
    }
  }

  private validateCSV(headers: string [], CSVData: string[]): boolean{
    //TODO complete validations
    let validatedChecks = true;

    if (headers[0] !== 'Type' || headers[1] !== 'ID/Name') {
      validatedChecks = false;
    }

    for (let i = 1; i < CSVData.length-1; i++) {
      let data = CSVData[i].split(',');
      if (data.length !== headers.length || data[0] === '' || data[1] ==='') {
        validatedChecks = false;
        break;
      }
    }
    return validatedChecks;
  }
}
