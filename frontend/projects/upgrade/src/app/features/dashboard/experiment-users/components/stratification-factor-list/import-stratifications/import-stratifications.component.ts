import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { StratificationFactorsService } from '../../../../../../core/stratification-factors/stratification-factors.service';

@Component({
  selector: 'app-import-stratifications',
  templateUrl: './import-stratifications.component.html',
  styleUrls: ['./import-stratifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStratificationsComponent {
  file: any;
  stratificationInfo: any;
  isStratificationCSVValid = true;
  csvData: any = [];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    private stratificationFactorsService: StratificationFactorsService,
    public dialogRef: MatDialogRef<ImportStratificationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick() {
    this.dialogRef.close();
  }

  importStratification() {
    this.stratificationFactorsService.importStratificationFactors(this.csvData);
    this.onCancelClick();
  }

  uploadFile(event: Event) {
    // Get the input element from the event
    const inputElement = event.target as HTMLInputElement;
    // Get the FileList from the input element
    const fileList = inputElement.files;

    if (fileList) {
      // Loop through the files in the FileList
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (file) {
          // Process the file (e.g., upload to server, read its contents, etc.)
          // For demonstration purposes, we will simply log the file name
          // If you want to read the contents of the file, you can use the FileReader API
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target?.result as string;
            console.log(fileContent); // Log the content of the file
            this.csvData.push({ "file": fileContent});
          };
          reader.readAsText(file);
        }
      }
    }
  }
}
