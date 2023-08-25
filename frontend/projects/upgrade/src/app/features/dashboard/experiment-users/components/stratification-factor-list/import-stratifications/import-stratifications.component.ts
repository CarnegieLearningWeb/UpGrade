import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-import-stratifications',
  templateUrl: './import-stratifications.component.html',
  styleUrls: ['./import-stratifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportStratificationsComponent {
  file: any;
  stratificationInfo: any;
  isStratificationJSONValid = true;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    public dialogRef: MatDialogRef<ImportStratificationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importStratification() {
    console.log('import stratifications');
  }

  uploadFile(event) {
    // const reader = new FileReader();
    // reader.addEventListener(
    //   'load',
    //   function () {
    //     const result = JSON.parse(reader.result as any);
    //     this.segmentInfo = result;
    //   }.bind(this)
    // );
    // reader.readAsText(event.target.files[0]);
    console.log(event.target.files[0].name);
  }
}
