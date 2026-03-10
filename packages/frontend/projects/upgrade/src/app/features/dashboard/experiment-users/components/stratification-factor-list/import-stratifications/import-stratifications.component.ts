import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { StratificationFactorsService } from '../../../../../../core/stratification-factors/stratification-factors.service';
import { CsvDataItem } from '../../../../../../core/stratification-factors/store/stratification-factors.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-import-stratifications',
  templateUrl: './import-stratifications.component.html',
  styleUrls: ['./import-stratifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImportStratificationsComponent {
  file: File;
  isStratificationCSVValid = true;
  csvData: CsvDataItem[] = [];
  uploadedFileCount = 0;
  subscriptions = new Subscription();
  isFactorAddRequestSuccess$ = this.stratificationFactorsService.isFactorAddRequestSuccess$;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    private stratificationFactorsService: StratificationFactorsService,
    public dialogRef: MatDialogRef<ImportStratificationsComponent>
  ) {}

  onCancelClick() {
    this.dialogRef.close(false);
  }

  importStratification() {
    this.stratificationFactorsService.importStratificationFactors(this.csvData);
    this.subscriptions = this.isFactorAddRequestSuccess$.subscribe((isSuccess) => {
      if (isSuccess) {
        this.dialogRef.close(true);
      }
    });
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
            this.csvData.push({ file: fileContent });
          };
          reader.readAsText(file);
        }
      }
    }
    this.uploadedFileCount = fileList.length;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
