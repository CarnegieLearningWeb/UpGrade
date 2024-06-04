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
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { FEATURE_FLAG_STATUS, SEGMENT_TYPE, FILTER_MODE } from '../../../../../../../../../../types/src';
import { AddFeatureFlagRequest } from '../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
  ],
  templateUrl: './add-feature-flag-modal.component.html',
  styleUrl: './add-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFeatureFlagModalComponent {
  isLoadingAddFeatureFlag$ = this.featureFlagsService.isLoadingAddFeatureFlag$;
  appContexts$ = this.featureFlagsService.appContexts$;
  featureFlagsListLengthChange$ = this.featureFlagsService.featureFlagsListLengthChange$;
  subscriptions = new Subscription();

  featureFlagForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    private formHelpersService: CommonFormHelpersService,
    public dialogRef: MatDialogRef<AddFeatureFlagModalComponent>
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.listenForFeatureFlagListLengthChanges();
  }

  buildForm(): void {
    this.featureFlagForm = this.formBuilder.group({
      name: ['', Validators.required],
      key: ['', Validators.required],
      description: [''],
      appContext: ['', Validators.required],
      tags: [null], // this will need corrected, it should be an array of strings, for now we're hackin
    });
  }

  // Close the modal once the feature flag list length changes, as that indicates actual success
  listenForFeatureFlagListLengthChanges(): void {
    this.subscriptions = this.featureFlagsListLengthChange$.subscribe(() => this.closeModal());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.featureFlagForm.valid) {
      // Handle extra form validation logic here?
      this.createAddFeatureFlagRequest();
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.featureFlagForm);
    }
  }

  createAddFeatureFlagRequest(): void {
    // temporarily use any until tags feature is added
    // const { name, key, description, appContext, tags }: FeatureFlagFormData = this.featureFlagForm.value;
    const { name, key, description, appContext, tags }: any = this.featureFlagForm.value;

    const addFeatureFlagRequest: AddFeatureFlagRequest = {
      name,
      key,
      description,
      status: FEATURE_FLAG_STATUS.DISABLED,
      context: [appContext],
      tags: tags?.split(',').map((tag: string) => tag.trim()) ?? [], // this will need corrected, it should be an array of strings, for now we're hackin
      featureFlagSegmentInclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      featureFlagSegmentExclusion: {
        segment: {
          type: SEGMENT_TYPE.PRIVATE,
        },
      },
      filterMode: FILTER_MODE.INCLUDE_ALL,
    };

    this.featureFlagsService.addFeatureFlag(addFeatureFlagRequest);
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
