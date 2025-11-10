import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatInputModule } from '@angular/material/input';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import {
  AddPrivateSegmentListRequest,
  EditPrivateSegmentListRequest,
  ExperimentSegmentListRequest,
  LIST_OPTION_TYPE,
  ListSegmentOption,
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
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subscription, timer } from 'rxjs';
import { SegmentsModule } from '../../../segments-legacy/segments.module';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import isEqual from 'lodash.isequal';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { CommonTagInputType } from '../../../../../core/feature-flags/store/feature-flags.model';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'upsert-private-segment-list-modal',
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
    SharedModule,
  ],
  templateUrl: './upsert-private-segment-list-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPrivateSegmentListModalComponent {
  @ViewChild('typeSelectRef') typeSelectRef: MatSelect;
  listOptionTypes$: Observable<{ value: string; viewValue: string }[]>;
  isLoadingUpsertFeatureFlagList$ = this.featureFlagService.isLoadingUpsertPrivateSegmentList$;
  initialFormValues$ = new BehaviorSubject<PrivateSegmentListFormData>(null);

  subscriptions = new Subscription();
  segmentsOptions$: Observable<ListSegmentOption[]>;
  segmentsFilteredByContext$: Observable<ListSegmentOption[]>;
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;
  isSegmentsListTypeDisabled$: Observable<boolean>;

  privateSegmentListForm: FormGroup;
  CommonTagInputType = CommonTagInputType;
  forceValidation = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertPrivateSegmentListParams>,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService,
    private featureFlagService: FeatureFlagsService,
    public dialogRef: MatDialogRef<UpsertPrivateSegmentListModalComponent>
  ) {}

  ngOnInit(): void {
    this.fetchData();
    this.createPrivateSegmentListForm();

    // Initialize listOptionTypes$ with the app context
    this.listOptionTypes$ = this.segmentsService.selectPrivateSegmentListTypeOptions$(
      this.config.params.sourceAppContext
    );

    this.initializeListeners();
    this.populateFormForEdit();
  }

  ngAfterViewInit() {
    if (
      [
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_EXCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_EXPERIMENT_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_EXPERIMENT_EXCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_SEGMENT_LIST,
      ].includes(this.config.params.action)
    ) {
      // Slight delay before opening the type select dropdown for a smoother UX
      // This gives a brief moment for the modal to settle visually before presenting options
      this.subscriptions.add(timer(150).subscribe(() => this.typeSelectRef.open()));
    }
  }

  get LIST_TYPES() {
    return LIST_OPTION_TYPE;
  }

  get selectedListType() {
    return this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.LIST_TYPE).value;
  }

  get valuesFormControl() {
    return this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES);
  }

  private segmentObjectValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      if (typeof value === 'string' || !value.id) {
        return { invalidSegmentSelection: true };
      }

      return null;
    };
  }

  // Function to sort the values
  sortValues() {
    const currentValues = this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES).value;
    const sortedValues = [...currentValues].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.VALUES).setValue(sortedValues);
  }

  // onBlur handler
  onBlur() {
    this.sortValues();
  }

  fetchData() {
    this.experimentService.fetchContextMetaData();
  }

  initializeListeners() {
    this.listenForSegments();
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
    this.listenForSegmentsFilteredByUserInput();
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
    this.listenToListTypeChanges();
  }

  populateFormForEdit(): void {
    if (
      ![
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_EXCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_EXPERIMENT_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_EXPERIMENT_EXCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_SEGMENT_LIST,
      ].includes(this.config.params.action)
    ) {
      return;
    }

    const sourceList = this.config.params.sourceList;
    if (!sourceList) {
      return;
    }

    const values = this.determineValues(sourceList.listType, sourceList.segment);
    const formValue: PrivateSegmentListFormData = {
      listType: sourceList.listType as LIST_OPTION_TYPE,
      segment: sourceList.segment,
      values,
      name: sourceList.segment.name,
      description: sourceList.segment.description,
    };

    this.privateSegmentListForm.patchValue(formValue, { emitEvent: false });

    // Update the initialFormValues$ with the populated form value
    this.initialFormValues$.next(formValue);

    // Trigger validators after populating the form
    this.setValidatorsBasedOnListType(sourceList.listType);
  }

  determineValues(listType: string, segment: Segment): string[] {
    switch (listType) {
      case LIST_OPTION_TYPE.INDIVIDUAL:
        return segment.individualForSegment.map((individual) => individual.userId);
      case LIST_OPTION_TYPE.SEGMENT:
        return [];
      default:
        return segment.groupForSegment.map((group) => group.groupId);
    }
  }

  listenForSegments() {
    this.segmentsFilteredByContext$ = this.segmentsService
      .selectListSegmentOptionsByContext(this.config.params.sourceAppContext)
      .pipe(
        // don't include self
        map((options) => options.filter((option) => option.id !== this.config.params.id))
      );
    this.isSegmentsListTypeDisabled$ = this.segmentsFilteredByContext$.pipe(
      map((segments) => {
        return segments.length === 0;
      })
    );
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

  listenForSegmentsFilteredByUserInput(): void {
    this.segmentsOptions$ = this.segmentsFilteredByContext$.pipe(
      combineLatestWith(
        this.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.SEGMENT).valueChanges.pipe(startWith(''))
      ),
      map(([segments, filterValue]) => {
        if (!filterValue || typeof filterValue !== 'string') {
          return segments;
        }
        return segments.filter((segment) => segment?.name.toLowerCase().includes((filterValue ?? '').toLowerCase()));
      })
    );
  }

  listenToListTypeChanges(): void {
    this.subscriptions.add(
      this.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS.LIST_TYPE).valueChanges.subscribe((listType) => {
        this.resetFormExceptSelectedListType(listType);
        this.setValidatorsBasedOnListType(listType);
      })
    );
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
      // Apply both required and custom segment object validator
      CommonFormHelpersService.setFieldValidators(this.privateSegmentListForm, segmentField, [
        Validators.required,
        this.segmentObjectValidator(),
      ]);
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
    this.forceValidation = true;
    if (this.privateSegmentListForm.valid) {
      this.sendRequest(this.config.params.action);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.privateSegmentListForm);
    }
  }

  sendRequest(action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION): void {
    const formData = this.privateSegmentListForm.value;
    const listType = formData.listType;
    const isExcludeList = [
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_EXCLUDE_LIST,
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_EXCLUDE_LIST,
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_EXPERIMENT_EXCLUDE_LIST,
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_EXPERIMENT_EXCLUDE_LIST,
    ].includes(action);
    let list: PrivateSegmentListRequestBase = this.createPrivateSegmentListBaseRequest(formData);
    list = this.createRequestByListType(formData, listType);

    const listRequest: PrivateSegmentListRequest = {
      id: this.config.params.id,
      enabled: this.config.params.sourceList?.enabled || isExcludeList, // Maintain existing status for edits, default to false for new include lists, true for all exclude lists
      listType,
      segment: list,
    };

    const addListRequest: AddPrivateSegmentListRequest = listRequest;
    const editRequest: EditPrivateSegmentListRequest = {
      ...listRequest,
      segment: {
        ...listRequest.segment,
        id: this.config.params.sourceList?.segment?.id,
      },
    };

    const addExperimentListRequest: ExperimentSegmentListRequest = {
      experimentId: this.config.params.id,
      list: { ...list, listType },
    };

    const experimentEditRequest: ExperimentSegmentListRequest = {
      ...addExperimentListRequest,
      list: {
        ...listRequest.segment,
        listType,
        id: this.config.params.sourceList?.segment?.id,
      },
    };

    switch (action) {
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST:
        this.sendAddFeatureFlagInclusionRequest(addListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_INCLUDE_LIST:
        this.sendUpdateFeatureFlagInclusionRequest(editRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_EXCLUDE_LIST:
        this.sendAddFeatureFlagExclusionRequest(addListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_FLAG_EXCLUDE_LIST:
        this.sendUpdateFeatureFlagExclusionRequest(editRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_SEGMENT_LIST:
        this.sendAddSegmentListRequest(addListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_SEGMENT_LIST:
        this.sendUpdateSegmentListRequest(editRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_EXPERIMENT_INCLUDE_LIST:
        this.sendAddExperimentInclusionRequest(addExperimentListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_EXPERIMENT_INCLUDE_LIST:
        this.sendUpdateExperimentInclusionRequest(experimentEditRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_EXPERIMENT_EXCLUDE_LIST:
        this.sendAddExperimentExclusionRequest(addExperimentListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION.EDIT_EXPERIMENT_EXCLUDE_LIST:
        this.sendUpdateExperimentExclusionRequest(experimentEditRequest);
        break;
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
      description: formData.description?.trim(),
      context: this.config.params.sourceAppContext,
      userIds: [],
      groups: [],
      subSegmentIds: [],
      type: SEGMENT_TYPE.PRIVATE,
    };

    return privateSegmentListRequestBase;
  }

  sendAddFeatureFlagInclusionRequest(addListRequest: AddPrivateSegmentListRequest): void {
    this.featureFlagService.addFeatureFlagInclusionPrivateSegmentList(addListRequest);
  }

  sendUpdateFeatureFlagInclusionRequest(editListRequest: EditPrivateSegmentListRequest): void {
    this.featureFlagService.updateFeatureFlagInclusionPrivateSegmentList(editListRequest);
  }

  sendAddExperimentInclusionRequest(addListRequest: ExperimentSegmentListRequest): void {
    this.experimentService.addExperimentInclusionPrivateSegmentList(addListRequest);
  }
  sendUpdateExperimentInclusionRequest(editListRequest: ExperimentSegmentListRequest): void {
    this.experimentService.updateExperimentInclusionPrivateSegmentList(editListRequest);
  }
  sendAddExperimentExclusionRequest(addListRequest: ExperimentSegmentListRequest): void {
    this.experimentService.addExperimentExclusionPrivateSegmentList(addListRequest);
  }
  sendUpdateExperimentExclusionRequest(editListRequest: ExperimentSegmentListRequest): void {
    this.experimentService.updateExperimentExclusionPrivateSegmentList(editListRequest);
  }

  sendAddFeatureFlagExclusionRequest(addListRequest: AddPrivateSegmentListRequest): void {
    this.featureFlagService.addFeatureFlagExclusionPrivateSegmentList(addListRequest);
  }

  sendUpdateFeatureFlagExclusionRequest(editListRequest: EditPrivateSegmentListRequest): void {
    this.featureFlagService.updateFeatureFlagExclusionPrivateSegmentList(editListRequest);
  }

  sendAddSegmentListRequest(addListRequest: AddPrivateSegmentListRequest): void {
    this.segmentsService.addPrivateSegmentList(addListRequest);
  }

  sendUpdateSegmentListRequest(editListRequest: EditPrivateSegmentListRequest): void {
    this.segmentsService.updatePrivateSegmentList(editListRequest);
  }

  onDownloadRequested(values: string[]) {
    if (this.privateSegmentListForm.get('name').valid) {
      this.downloadValuesAsCSV(values, this.privateSegmentListForm.get('name').value);
    } else {
      this.privateSegmentListForm.get('name').markAsTouched();
    }
  }

  private downloadValuesAsCSV(values: string[], fileName: string): void {
    const csvContent = values.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
