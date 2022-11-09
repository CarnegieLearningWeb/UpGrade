import { Component, ChangeDetectionStrategy, ViewChild, Inject } from '@angular/core';
import {
  NewFlagDialogData,
  NewFlagDialogEvents,
  NewFlagPaths,
  FeatureFlag,
} from '../../../../../../core/feature-flags/store/feature-flags.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

@Component({
  selector: 'app-new-flag',
  templateUrl: './new-flag.component.html',
  styleUrls: ['./new-flag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFlagComponent {
  newFlagData: any = {};
  flagInfo: FeatureFlag;
  @ViewChild('stepper') stepper: any;

  constructor(
    private dialogRef: MatDialogRef<NewFlagComponent>,
    private featureFlagService: FeatureFlagsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.flagInfo = this.data.flagInfo;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getFlagData(event: NewFlagDialogData) {
    const { type, formData, path } = event;
    switch (type) {
      case NewFlagDialogEvents.CLOSE_DIALOG:
        this.onNoClick();
        break;
      case NewFlagDialogEvents.SEND_FORM_DATA:
        this.newFlagData = {
          ...this.newFlagData,
          ...formData,
        };
        this.stepper.next();
        if (path === NewFlagPaths.FLAG_VARIATIONS) {
          this.newFlagData = { ...this.newFlagData, status: false };
          this.featureFlagService.createNewFeatureFlag(this.newFlagData);
          this.onNoClick();
        }
        break;
      case NewFlagDialogEvents.UPDATE_FLAG:
        this.newFlagData = {
          ...this.flagInfo,
          ...this.newFlagData,
          ...formData,
        };
        this.featureFlagService.updateFeatureFlag(this.newFlagData);
        this.onNoClick();
        break;
    }
  }
}
