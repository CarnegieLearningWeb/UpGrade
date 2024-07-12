import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
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
import { FeatureFlag, FeatureFlagFormData } from '../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

@Component({
  selector: 'edit-add-feature-flag-modal',
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
    CommonTagsInputComponent,
  ],
  templateUrl: './edit-feature-flag-modal.component.html',
  styleUrl: './edit-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditFeatureFlagModalComponent {
  isLoadingUpsertFeatureFlag$ = this.featureFlagsService.isLoadingUpsertFeatureFlag$;
  isSelectedFeatureFlagUpdated$ = this.featureFlagsService.isSelectedFeatureFlagUpdated$;
  selectedFlag$ = this.featureFlagsService.selectedFeatureFlag$;
  appContexts$ = this.featureFlagsService.appContexts$;
  subscriptions = new Subscription();
  flag: FeatureFlag;

  featureFlagForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    private experimentService: ExperimentService,
    private formHelpersService: CommonFormHelpersService,
    public dialogRef: MatDialogRef<EditFeatureFlagModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.buildForm();
    this.initializeFormValues();
    this.listenForFeatureFlagGetUpdated();
    this.listenOnNameChangesToUpdateKey();
  }

  buildForm(): void {
    this.featureFlagForm = this.formBuilder.group({
      name: ['', Validators.required],
      key: ['', Validators.required],
      description: [''],
      appContext: ['', Validators.required],
      tags: [],
    });
  }

  initializeFormValues(): void {
    this.subscriptions.add(
      this.selectedFlag$.subscribe((selectedFlag) => {
        this.flag = selectedFlag;
        if (selectedFlag) {
          this.featureFlagForm.patchValue({
            name: selectedFlag.name,
            key: selectedFlag.key,
            description: selectedFlag.description,
            appContext: selectedFlag.context ? selectedFlag.context[0] : '',
            tags: selectedFlag.tags,
          });
        }
      })
    );
  }

  listenOnNameChangesToUpdateKey(): void {
    this.featureFlagForm.get('name')?.valueChanges.subscribe((name) => {
      const keyControl = this.featureFlagForm.get('key');
      if (keyControl && !keyControl.dirty) {
        keyControl.setValue(this.featureFlagsService.convertNameStringToKey(name));
      }
    });
  }

  // Close the modal once the feature flag list length changes, as that indicates actual success
  listenForFeatureFlagGetUpdated(): void {
    this.subscriptions = this.isSelectedFeatureFlagUpdated$.subscribe(() => this.closeModal());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.featureFlagForm.valid) {
      // Handle extra form validation logic here?
      this.updateFeatureFlagRequest();
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.featureFlagForm);
    }
  }

  updateFeatureFlagRequest(): void {
    const { name, key, description, appContext, tags }: FeatureFlagFormData = this.featureFlagForm.value;

    this.flag = {
      ...this.flag,
      name,
      key,
      description,
      context: [appContext],
      tags: tags, // it is now an array of strings
    };

    this.featureFlagsService.updateFeatureFlag(this.flag);
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
