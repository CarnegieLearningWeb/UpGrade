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
import { CommonModule, NgTemplateOutlet } from '@angular/common';
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
    CommonModule,
    NgTemplateOutlet,
    MatIcon,
    ReactiveFormsModule,
  ],
  templateUrl: './add-feature-flag-modal.component.html',
  styleUrl: './add-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFeatureFlagModalComponent {
  // service references
  isLoadingAddFeatureFlag$ = this.featureFlagsService.isLoadingAddFeatureFlag$;
  appContexts$ = this.featureFlagsService.appContexts$;
  featureFlagsListLengthChange$ = this.featureFlagsService.featureFlagsListLengthChange$;

  featureFlagForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    public dialogRef: MatDialogRef<AddFeatureFlagModalComponent>
  ) {}

  ngOnInit() {
    // give this types
    this.featureFlagForm = this.formBuilder.group({
      name: ['', Validators.required],
      key: ['', Validators.required],
      description: [''],
      appContext: ['', Validators.required],
      tags: [null], // this will need corrected, it should be an array of strings, for now we're hackin
    });

    this.isLoadingAddFeatureFlag$.subscribe((value) => console.log('>> isLoadingAddFeatureFlag', value));
    this.featureFlagsListLengthChange$.subscribe(() => this.closeModal());
  }

  onPrimaryActionBtnClicked() {
    if (this.featureFlagForm.valid) {
      // Handle form submission logic here
      console.log('Feature flag created:', this.featureFlagForm.value);
      this.featureFlagsService.addFeatureFlag(this.featureFlagForm.value);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      Object.keys(this.featureFlagForm.controls).forEach((field) => {
        const control = this.featureFlagForm.get(field);
        control.markAsTouched({ onlySelf: true });
      });
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
