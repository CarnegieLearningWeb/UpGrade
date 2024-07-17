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
import { FEATURE_FLAG_STATUS, FILTER_MODE } from '../../../../../../../../../../types/src';
import {
  AddFeatureFlagRequest,
  DuplicateFeatureFlagSuffix,
  FeatureFlag,
  FeatureFlagFormData,
  ModifyFeatureFlagRequest,
  UPSERT_MODAL_ACTION,
  UpsertModalParams,
} from '../../../../../core/feature-flags/store/feature-flags.model';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { CommonTextHelpersService } from '../../../../../shared/services/common-text-helpers.service';

@Component({
  selector: 'upsert-add-feature-flag-modal',
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
  templateUrl: './upsert-feature-flag-modal.component.html',
  styleUrl: './upsert-feature-flag-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertFeatureFlagModalComponent {
  isLoadingUpsertFeatureFlag$ = this.featureFlagsService.isLoadingUpsertFeatureFlag$;
  isSelectedFeatureFlagUpdated$ = this.featureFlagsService.isSelectedFeatureFlagUpdated$;
  selectedFlag$ = this.featureFlagsService.selectedFeatureFlag$;
  appContexts$ = this.featureFlagsService.appContexts$;
  subscriptions = new Subscription();

  featureFlagForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertModalParams>,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private featureFlagsService: FeatureFlagsService,
    private experimentService: ExperimentService,
    private formHelpersService: CommonFormHelpersService,
    public dialogRef: MatDialogRef<UpsertFeatureFlagModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.createFeatureFlagForm();
    this.listenForFeatureFlagGetUpdated();
    this.listenOnNameChangesToUpdateKey();
  }

  createFeatureFlagForm(): void {
    const { sourceFlag, action } = this.config.params;

    const initialValues: FeatureFlag = { ...sourceFlag };

    if (sourceFlag && action === UPSERT_MODAL_ACTION.DUPLICATE) {
      initialValues.name += DuplicateFeatureFlagSuffix;
      initialValues.key += DuplicateFeatureFlagSuffix;
    }

    this.featureFlagForm = this.formBuilder.group({
      name: [initialValues.name || '', Validators.required],
      key: [initialValues.key || '', Validators.required],
      description: [initialValues.description || ''],
      appContext: [initialValues.context?.[0] || '', Validators.required],
      tags: [initialValues.tags || []],
    });
  }

  listenOnNameChangesToUpdateKey(): void {
    this.subscriptions = this.featureFlagForm.get('name')?.valueChanges.subscribe((name) => {
      const keyControl = this.featureFlagForm.get('key');
      if (keyControl && !keyControl.dirty) {
        keyControl.setValue(CommonTextHelpersService.convertStringToFeatureFlagKeyFormat(name));
      }
    });
  }

  // Close the modal once the feature flag list length changes, as that indicates actual success
  listenForFeatureFlagGetUpdated(): void {
    this.subscriptions = this.isSelectedFeatureFlagUpdated$.subscribe(() => this.closeModal());
  }

  onPrimaryActionBtnClicked(): void {
    if (this.featureFlagForm.valid) {
      // Handle extra frontend form validation logic here?
      this.createRequest(this.config.params.action, this.config.params.sourceFlag);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.featureFlagForm);
    }
  }

  createRequest(action: UPSERT_MODAL_ACTION, sourceFlag?: FeatureFlag): void {
    const formData: FeatureFlagFormData = this.featureFlagForm.value;

    if (action === UPSERT_MODAL_ACTION.ADD || action === UPSERT_MODAL_ACTION.DUPLICATE) {
      this.createAddRequest(formData);
    } else if (action === UPSERT_MODAL_ACTION.EDIT && sourceFlag) {
      this.createEditRequest(formData, sourceFlag);
    } else {
      console.error('UpsertFeatureFlagModalComponent: createRequest: Invalid action or missing sourceFlag');
    }
  }

  private createAddRequest({ name, key, description, appContext, tags }: FeatureFlagFormData): void {
    const flagRequest: AddFeatureFlagRequest = {
      name,
      key,
      description,
      context: [appContext],
      tags,
      status: FEATURE_FLAG_STATUS.DISABLED,
      filterMode: FILTER_MODE.INCLUDE_ALL,
      featureFlagSegmentInclusion: [],
      featureFlagSegmentExclusion: [],
    };

    this.featureFlagsService.addFeatureFlag(flagRequest);
  }

  private createEditRequest(
    { name, key, description, appContext, tags }: FeatureFlagFormData,
    { id, status, filterMode, featureFlagSegmentInclusion, featureFlagSegmentExclusion }: FeatureFlag
  ): void {
    const flagRequest: ModifyFeatureFlagRequest = {
      id,
      name,
      key,
      description,
      context: [appContext],
      tags,
      status,
      filterMode,
      featureFlagSegmentInclusion,
      featureFlagSegmentExclusion,
    };

    this.featureFlagsService.updateFeatureFlag(flagRequest);
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
