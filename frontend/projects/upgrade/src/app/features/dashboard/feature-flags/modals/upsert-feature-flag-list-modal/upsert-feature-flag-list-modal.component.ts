import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { UpsertFeatureFlagListParams } from '../../../../../core/feature-flags/store/feature-flags.model';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'upsert-feature-flag-list-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './upsert-feature-flag-list-modal.component.html',
  styleUrl: './upsert-feature-flag-list-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertFeatureFlagListModalComponent {
  selectedFlag$ = this.featureFlagsService.selectedFeatureFlag$;
  listOptionTypes$ = this.featureFlagsService.selectFeatureFlagListTypeOptions$;

  featureFlagListForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertFeatureFlagListParams>,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    private formHelpersService: CommonFormHelpersService,
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<UpsertFeatureFlagListModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.createFeatureFlagListForm();
  }

  createFeatureFlagListForm(): void {
    this.featureFlagListForm = this.formBuilder.group({
      type: ['', Validators.required],
    });
  }

  onPrimaryActionBtnClicked(): void {
    if (this.featureFlagListForm.valid) {
      // Handle extra frontend form validation logic here?
      // TODO: create request
      console.log(this.featureFlagListForm.value);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.featureFlagListForm);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
