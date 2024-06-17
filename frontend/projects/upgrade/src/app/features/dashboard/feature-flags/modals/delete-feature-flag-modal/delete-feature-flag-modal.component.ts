import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-feature-flag-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    FormsModule,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './delete-feature-flag-modal.component.html',
  styleUrl: './delete-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteFeatureFlagModalComponent {
  selectedFlag$ = this.featureFlagsService.selectedFeatureFlag$;
  inputValue = '';
  private inputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  // Observable that emits true if inputValue is 'delete', false otherwise
  isDeleteNotTyped$: Observable<boolean> = this.inputSubject
    .asObservable()
    .pipe(map((value) => value.toLowerCase() !== 'delete'));

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CommonModalConfig & { flagName: string; flagId: string },
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

  closeModal() {
    this.dialogRef.close();
  }
}
