import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatInputModule } from '@angular/material/input';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import {
  AddPrivateSegmentListRequest,
  LIST_OPTION_TYPE,
  PRIVATE_SEGMENT_LIST_FORM_DEFAULTS,
  PRIVATE_SEGMENT_LIST_FORM_FIELDS,
  PrivateSegmentListFormData,
  PrivateSegmentListRequest,
  PrivateSegmentListRequestBase,
  Segment,
  UPSERT_PRIVATE_SEGMENT_LIST_ACTION,
  UpsertPrivateSegmentListParams,
} from '../../../../../core/segments/store/segments.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subscription } from 'rxjs';
import { SegmentsModule } from '../../segments.module';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import isEqual from 'lodash.isequal';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';

@Component({
  selector: 'upsert-private-segment-list-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    CommonTagsInputComponent,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SegmentsModule,
  ],
  templateUrl: './upsert-private-segment-list-modal.component.html',
  styleUrl: './upsert-private-segment-list-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPrivateSegmentListModalComponent {
  listOptionTypes$ = this.segmentsService.selectPrivateSegmentListTypeOptions$;
  isLoadingUpsertFeatureFlagList$ = this.featureFlagService.isLoadingUpsertPrivateSegmentList$;
  initialFormValues$ = new BehaviorSubject<PrivateSegmentListFormData>(null);

  subscriptions = new Subscription();
  segmentFilteredByContext$: Observable<Segment[]>;
  isFormValid$: Observable<boolean>;
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;

  privateSegmentListForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertPrivateSegmentListParams>,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService,
    private featureFlagService: FeatureFlagsService,
    public dialogRef: MatDialogRef<UpsertPrivateSegmentListModalComponent>
  ) {
    this.segmentFilteredByContext$ = this.segmentsService.selectSegmentsByContext(this.config.params.sourceAppContext);
  }

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.segmentsService.fetchSegments();
    this.createPrivateSegmentListForm();
  }

  get LIST_TYPES() {
    return LIST_OPTION_TYPE;
  }

  get selectedListType() {
    return this.privateSegmentListForm?.get('listType').value;
  }

  get valuesFormControl() {
    return this.privateSegmentListForm?.get('values');
  }

  listenForPrimaryButtonDisabled() {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertFeatureFlagList$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(([isLoading, isInitialFormValueChanged]) => isLoading || !isInitialFormValueChanged)
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  listenForIsInitialFormValueChanged() {
    this.isInitialFormValueChanged$ = this.privateSegmentListForm.valueChanges.pipe(
      startWith(this.privateSegmentListForm.value),
      map(() => !isEqual(this.privateSegmentListForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  listenForIsFormValid(): void {
    this.isFormValid$ = this.privateSegmentListForm.statusChanges.pipe(map((status) => status === 'VALID'));
  }

  createPrivateSegmentListForm(): void {
    this.privateSegmentListForm = this.formBuilder.group({
      listType: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.LIST_TYPE, Validators.required],
      segment: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.SEGMENT],
      values: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.VALUES],
      name: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.NAME],
      description: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.DESCRIPTION],
    });
    this.initialFormValues$.next(this.privateSegmentListForm.value);
    this.subscribeToListTypeChanges();
  }

  subscribeToListTypeChanges(): void {
    this.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.LIST_TYPE).valueChanges.subscribe((listType) => {
      this.resetFormExceptSelectedListType(listType);
      this.setValidatorsBasedOnListType(listType);
    });
  }

  resetFormExceptSelectedListType(currentListType: string): void {
    this.privateSegmentListForm.reset(
      {
        listType: currentListType,
        segment: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.SEGMENT,
        values: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.VALUES,
        name: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.NAME,
        description: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS.DESCRIPTION,
      },
      { emitEvent: false }
    );
  }

  setValidatorsBasedOnListType(listType: string): void {
    const segmentField = PRIVATE_SEGMENT_LIST_FORM_FIELDS.SEGMENT;
    const valuesField = PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES;
    const nameField = PRIVATE_SEGMENT_LIST_FORM_FIELDS.NAME;
    // Clear existing validators
    CommonFormHelpersService.clearValidatorsByFormField(this.privateSegmentListForm, [
      segmentField,
      valuesField,
      nameField,
    ]);

    if (listType === this.LIST_TYPES.SEGMENT) {
      CommonFormHelpersService.setFieldValidators(this.privateSegmentListForm, segmentField, [Validators.required]);
    } else {
      CommonFormHelpersService.setFieldValidators(this.privateSegmentListForm, valuesField, [Validators.required]);
      CommonFormHelpersService.setFieldValidators(this.privateSegmentListForm, nameField, [Validators.required]);
    }
  }

  // this is used in html template [displayWith] directive so we can show the name even though the segment object is the real value selected
  displayAsSegmentName(segment: Segment): string {
    return segment ? segment.name : '';
  }

  onPrimaryActionBtnClicked(): void {
    if (this.privateSegmentListForm.valid) {
      // Handle extra frontend form validation logic here?
      // TODO: create request
      console.log(this.privateSegmentListForm.value);
      this.sendRequest(this.config.params.action);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.privateSegmentListForm);
    }
  }

  sendRequest(action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION): void {
    const formData = this.privateSegmentListForm.value;
    const listType = formData.listType;
    let list: PrivateSegmentListRequestBase = this.createPrivateSegmentListBaseRequest(formData);
    list = this.createRequestByListType(formData, listType);

    const listRequest: PrivateSegmentListRequest = {
      enabled: false,
      listType,
      list,
    };

    if (action === UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST) {
      this.sendAddFeatureFlagInclusionRequest(listRequest);
    }
  }

  private createRequestByListType(
    formData: PrivateSegmentListFormData,
    listType: string
  ): PrivateSegmentListRequestBase {
    const privateSegmentList = this.createPrivateSegmentListBaseRequest(formData);

    if (listType === this.LIST_TYPES.SEGMENT) {
      privateSegmentList.subSegmentIds = [formData.segment.id];
      privateSegmentList.name = formData.segment.name;
      privateSegmentList.description = formData.segment.description;
    } else if (listType === this.LIST_TYPES.INDIVIDUAL) {
      privateSegmentList.userIds = formData.values;
    } else {
      privateSegmentList.groups = formData.values.map((id: string) => ({ groupId: id, type: listType }));
    }

    return privateSegmentList;
  }

  createPrivateSegmentListBaseRequest(formData: PrivateSegmentListFormData): PrivateSegmentListRequestBase {
    const privateSegmentListRequestBase: PrivateSegmentListRequestBase = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      context: this.config.params.sourceAppContext,
      userIds: [],
      groups: [],
      subSegmentIds: [],
      type: SEGMENT_TYPE.PRIVATE,
    };

    return privateSegmentListRequestBase;
  }

  sendAddFeatureFlagInclusionRequest(request: AddPrivateSegmentListRequest): void {
    this.featureFlagService.addFeatureFlagInclusionPrivateSegmentList(request);
  }

  closeModal() {
    this.dialogRef.close();
  }
}
