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
import { NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';

export interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  appContext: string;
  tags: string[];
}

@Component({
  selector: 'app-add-feature-flag-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSelectModule,
    NgIf,
    NgForOf,
    NgTemplateOutlet,
    MatIcon,
    ReactiveFormsModule,
  ],
  templateUrl: './add-feature-flag-modal.component.html',
  styleUrl: './add-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFeatureFlagModalComponent {
  selectIsLoadingAddFeatureFlag$ = this.featureFlagsService.isLoadingAddFeatureFlag$;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    public dialogRef: MatDialogRef<AddFeatureFlagModalComponent>
  ) {}

  featureFlagForm: FormGroup;
  appContexts: string[] = ['Context A', 'Context B', 'Context C'];

  ngOnInit() {
    // give this types
    this.featureFlagForm = this.formBuilder.group({
      name: ['', Validators.required],
      key: ['', Validators.required],
      description: [''],
      appContext: ['', Validators.required],
      tags: [''],
    });
  }

  onPrimaryActionBtnClicked() {
    console.log('this.featureFlagForm.valid', this.featureFlagForm.valid);
    if (this.featureFlagForm.valid) {
      // Handle form submission logic here
      console.log('Feature flag created:', this.featureFlagForm.value);
      this.featureFlagsService.addFeatureFlag(this.featureFlagForm.value);
    } else {
      // handle showing form errors
    }
    // stay on modal but:
    // disable form and buttons
    // validate form
    // show error message if form is invalid
    // show loading spinner if valid
    // dispatch action to add feature flag
    // close the modal if the action is successful
    // show error message if the action fails and stay on modal
  }

  closeModal() {
    this.dialogRef.close();
  }
}
