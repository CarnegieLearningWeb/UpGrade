import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { BehaviorSubject, Observable, Subscription, combineLatest, map } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-add-feature-flag-modal',
  imports: [CommonModalComponent, MatInputModule, FormsModule, TranslateModule, CommonModule, SharedModule],
  templateUrl: './delete-feature-flag-modal.component.html',
  styleUrl: './delete-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFeatureFlagModalComponent {
  selectedFlag$ = this.featureFlagsService.selectedFeatureFlag$;
  inputValue = '';
  subscriptions = new Subscription();
  isLoadingFeatureFlagDelete$ = this.featureFlagsService.isLoadingFeatureFlagDelete$;
  private inputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  // Observable that emits true if inputValue is 'delete', false otherwise
  isDeleteNotTyped$: Observable<boolean> = this.inputSubject.pipe(
    map((value) => value.trim().toLowerCase() !== 'delete')
  );

  isDeleteActionBtnDisabled$: Observable<boolean> = combineLatest([
    this.isDeleteNotTyped$,
    this.isLoadingFeatureFlagDelete$,
  ]).pipe(map(([isDeleteNotTyped, isLoading]) => isDeleteNotTyped || isLoading));

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig,
    public dialog: MatDialog,
    private featureFlagsService: FeatureFlagsService,
    public dialogRef: MatDialogRef<DeleteFeatureFlagModalComponent>
  ) {}

  onInputChange(value: string): void {
    this.inputSubject.next(value);
  }

  onPrimaryActionBtnClicked(flagId: string) {
    this.featureFlagsService.deleteFeatureFlag(flagId);
    this.dialogRef.close();
  }
}
