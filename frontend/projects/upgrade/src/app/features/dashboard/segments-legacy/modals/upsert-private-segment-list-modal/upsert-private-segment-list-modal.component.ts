import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatInputModule } from '@angular/material/input';
import { SegmentsService_LEGACY } from '../../../../../core/segments_LEGACY/segments.service._LEGACY';
import {
  AddPrivateSegmentListRequest_LEGACY,
  EditPrivateSegmentListRequest_LEGACY,
  LIST_OPTION_TYPE_LEGACY,
  PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY,
  PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY,
  PrivateSegmentListFormData_LEGACY,
  PrivateSegmentListRequest_LEGACY,
  PrivateSegmentListRequestBase_LEGACY,
  Segment_LEGACY,
  UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY,
  UpsertPrivateSegmentListParams_LEGACY,
} from '../../../../../core/segments_LEGACY/store/segments.model._LEGACY';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subscription, timer } from 'rxjs';
import { SegmentsModule } from '../../segments.module';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import isEqual from 'lodash.isequal';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { CommonTagInputType } from '../../../../../core/feature-flags/store/feature-flags.model';

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
  ],
  templateUrl: './upsert-private-segment-list-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPrivateSegmentListModalComponent {
  @ViewChild('typeSelectRef') typeSelectRef: MatSelect;
  listOptionTypes$ = this.segmentsService.selectPrivateSegmentListTypeOptions$;
  isLoadingUpsertFeatureFlagList$ = this.featureFlagService.isLoadingUpsertPrivateSegmentList$;
  initialFormValues$ = new BehaviorSubject<PrivateSegmentListFormData_LEGACY>(null);

  subscriptions = new Subscription();
  segmentsOptions$: Observable<Segment_LEGACY[]>;
  segmentsFilteredByContext$: Observable<Segment_LEGACY[]>;
  isPrimaryButtonDisabled$: Observable<boolean>;
  isInitialFormValueChanged$: Observable<boolean>;
  isSegmentsListTypeDisabled$: Observable<boolean>;

  privateSegmentListForm: FormGroup;
  CommonTagInputType = CommonTagInputType;
  forceValidation = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertPrivateSegmentListParams_LEGACY>,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private segmentsService: SegmentsService_LEGACY,
    private experimentService: ExperimentService,
    private featureFlagService: FeatureFlagsService,
    public dialogRef: MatDialogRef<UpsertPrivateSegmentListModalComponent>
  ) {}

  ngOnInit(): void {
    this.fetchData();
    this.createPrivateSegmentListForm();
    this.initializeListeners();
    this.populateFormForEdit();
  }

  ngAfterViewInit() {
    if (
      [
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.ADD_FLAG_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.ADD_FLAG_EXCLUDE_LIST,
      ].includes(this.config.params.action)
    ) {
      // Slight delay before opening the type select dropdown for a smoother UX
      // This gives a brief moment for the modal to settle visually before presenting options
      this.subscriptions.add(timer(150).subscribe(() => this.typeSelectRef.open()));
    }
  }

  get LIST_TYPES() {
    return LIST_OPTION_TYPE_LEGACY;
  }

  get selectedListType() {
    return this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.LIST_TYPE).value;
  }

  get valuesFormControl() {
    return this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.VALUES);
  }

  // Function to sort the values
  sortValues() {
    const currentValues = this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.VALUES).value;
    const sortedValues = [...currentValues].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    this.privateSegmentListForm?.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.VALUES).setValue(sortedValues);
  }

  // onBlur handler
  onBlur() {
    this.sortValues();
  }

  fetchData() {
    this.experimentService.fetchContextMetaData();
    this.segmentsService.fetchSegments();
  }

  initializeListeners() {
    this.listenForSegments();
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
    this.listenForSegmentsFilteredByUserInput();
  }

  createPrivateSegmentListForm(): void {
    this.privateSegmentListForm = this.formBuilder.group({
      listType: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.LIST_TYPE, Validators.required],
      segment: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.SEGMENT],
      values: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.VALUES],
      name: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.NAME],
      description: [PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.DESCRIPTION],
    });
    this.initialFormValues$.next(this.privateSegmentListForm.value);
    this.listenToListTypeChanges();
  }

  populateFormForEdit(): void {
    if (
      ![
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.EDIT_FLAG_INCLUDE_LIST,
        UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.EDIT_FLAG_EXCLUDE_LIST,
      ].includes(this.config.params.action)
    ) {
      return;
    }

    const sourceList = this.config.params.sourceList;
    if (!sourceList) {
      return;
    }

    const values = this.determineValues(sourceList.listType, sourceList.segment);
    const formValue: PrivateSegmentListFormData_LEGACY = {
      listType: sourceList.listType as LIST_OPTION_TYPE_LEGACY,
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

  determineValues(listType: string, segment: Segment_LEGACY): string[] {
    switch (listType) {
      case LIST_OPTION_TYPE_LEGACY.INDIVIDUAL:
        return segment.individualForSegment.map((individual) => individual.userId);
      case LIST_OPTION_TYPE_LEGACY.SEGMENT:
        return [];
      default:
        return segment.groupForSegment.map((group) => group.groupId);
    }
  }

  listenForSegments() {
    this.segmentsFilteredByContext$ = this.segmentsService.selectSegmentsByContext(this.config.params.sourceAppContext);
    this.isSegmentsListTypeDisabled$ = this.segmentsFilteredByContext$.pipe(map((segments) => segments.length === 0));
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
      map((segments) => segments.sort((a, b) => a.name.localeCompare(b.name))),
      combineLatestWith(
        this.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.SEGMENT).valueChanges.pipe(startWith(''))
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
      this.privateSegmentListForm.get(PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.LIST_TYPE).valueChanges.subscribe((listType) => {
        this.resetFormExceptSelectedListType(listType);
        this.setValidatorsBasedOnListType(listType);
      })
    );
  }

  resetFormExceptSelectedListType(currentListType: string): void {
    this.privateSegmentListForm.reset(
      {
        listType: currentListType,
        segment: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.SEGMENT,
        values: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.VALUES,
        name: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.NAME,
        description: PRIVATE_SEGMENT_LIST_FORM_DEFAULTS_LEGACY.DESCRIPTION,
      },
      { emitEvent: false }
    );
  }

  setValidatorsBasedOnListType(listType: string): void {
    const segmentField = PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.SEGMENT;
    const valuesField = PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.VALUES;
    const nameField = PRIVATE_SEGMENT_LIST_FORM_FIELDS_LEGACY.NAME;
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
  displayAsSegmentName(segment: Segment_LEGACY): string {
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

  sendRequest(action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY): void {
    const formData = this.privateSegmentListForm.value;
    const listType = formData.listType;
    const isExcludeList = [
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.ADD_FLAG_EXCLUDE_LIST,
      UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.EDIT_FLAG_EXCLUDE_LIST,
    ].includes(action);
    let list: PrivateSegmentListRequestBase_LEGACY = this.createPrivateSegmentListBaseRequest(formData);
    list = this.createRequestByListType(formData, listType);

    const listRequest: PrivateSegmentListRequest_LEGACY = {
      flagId: this.config.params.flagId,
      enabled: this.config.params.sourceList?.enabled || isExcludeList, // Maintain existing status for edits, default to false for new include lists, true for all exclude lists
      listType,
      segment: list,
    };

    const addListRequest: AddPrivateSegmentListRequest_LEGACY = listRequest;
    const editRequest: EditPrivateSegmentListRequest_LEGACY = {
      ...listRequest,
      segment: {
        ...listRequest.segment,
        id: this.config.params.sourceList?.segment?.id,
      },
    };

    switch (action) {
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.ADD_FLAG_INCLUDE_LIST:
        this.sendAddFeatureFlagInclusionRequest(addListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.EDIT_FLAG_INCLUDE_LIST:
        this.sendUpdateFeatureFlagInclusionRequest(editRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.ADD_FLAG_EXCLUDE_LIST:
        this.sendAddFeatureFlagExclusionRequest(addListRequest);
        break;
      case UPSERT_PRIVATE_SEGMENT_LIST_ACTION_LEGACY.EDIT_FLAG_EXCLUDE_LIST:
        this.sendUpdateFeatureFlagExclusionRequest(editRequest);
        break;
    }
  }

  private createRequestByListType(
    formData: PrivateSegmentListFormData_LEGACY,
    listType: string
  ): PrivateSegmentListRequestBase_LEGACY {
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

  createPrivateSegmentListBaseRequest(formData: PrivateSegmentListFormData_LEGACY): PrivateSegmentListRequestBase_LEGACY {
    const privateSegmentListRequestBase: PrivateSegmentListRequestBase_LEGACY = {
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

  sendAddFeatureFlagInclusionRequest(addListRequest: AddPrivateSegmentListRequest_LEGACY): void {
    this.featureFlagService.addFeatureFlagInclusionPrivateSegmentList(addListRequest);
  }

  sendUpdateFeatureFlagInclusionRequest(editListRequest: EditPrivateSegmentListRequest_LEGACY): void {
    this.featureFlagService.updateFeatureFlagInclusionPrivateSegmentList(editListRequest);
  }

  sendAddFeatureFlagExclusionRequest(addListRequest: AddPrivateSegmentListRequest_LEGACY): void {
    this.featureFlagService.addFeatureFlagExclusionPrivateSegmentList(addListRequest);
  }

  sendUpdateFeatureFlagExclusionRequest(editListRequest: EditPrivateSegmentListRequest_LEGACY): void {
    this.featureFlagService.updateFeatureFlagExclusionPrivateSegmentList(editListRequest);
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
