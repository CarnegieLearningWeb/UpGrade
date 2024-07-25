import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import { TranslateModule } from '@ngx-translate/core';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { MatInputModule } from '@angular/material/input';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import {
  Group,
  LIST_OPTION_TYPE,
  PrivateSegmentListFormData,
  Segment,
  UPSERT_PRIVATE_SEGMENT_LIST_ACTION,
  UpsertPrivateSegmentListParams,
} from '../../../../../core/segments/store/segments.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subscription } from 'rxjs';
import { SegmentsModule } from '../../segments.module';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import { UPSERT_FEATURE_FLAG_ACTION } from '../../../../../core/feature-flags/store/feature-flags.model';
import isEqual from 'lodash.isequal';

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
  isLoadingUpsertFeatureFlagList$ = this.segmentsService.isLoadingUpsertFeatureFlagList$;
  initialFormValues$ = new BehaviorSubject<PrivateSegmentListFormData>(null);

  subscriptions = new Subscription();
  segmentFilteredByContext$ = this.segmentsService.getSegmentsByContext(this.config.params.sourceAppContext);
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
    private formHelpersService: CommonFormHelpersService,
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<UpsertPrivateSegmentListModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.createPrivateSegmentListForm();
    this.segmentsService.fetchSegments();
    this.listenForFilteredSegments();
  }

  listenForFilteredSegments(): void {
    this.subscriptions.add(this.segmentFilteredByContext$.subscribe());
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

  get LIST_TYPES() {
    return LIST_OPTION_TYPE;
  }

  get selectedListType() {
    return this.privateSegmentListForm.get('listType').value;
  }

  get valuesFormControl() {
    return this.privateSegmentListForm.get('values');
  }

  createPrivateSegmentListForm(): void {
    this.privateSegmentListForm = this.formBuilder.group({
      listType: ['', Validators.required],
      segment: [null],
      values: [[]],
      name: [''],
      description: [''],
    });
    this.initialFormValues$.next(this.privateSegmentListForm.value);
    this.subscribeToListTypeChanges();
  }

  subscribeToListTypeChanges(): void {
    this.privateSegmentListForm.get('listType').valueChanges.subscribe((type) => {
      this.resetForm(type);
      this.setValidatorsBasedOnListType(type);
    });
  }

  resetForm(currentListType: string): void {
    this.privateSegmentListForm.reset(
      {
        listType: currentListType,
        segment: null,
        values: [],
        name: '',
        description: '',
      },
      { emitEvent: false }
    );
  }

  setValidatorsBasedOnListType(listType: string): void {
    // Define a mapping of list types to their validators
    const validatorsMap = {
      [this.LIST_TYPES.SEGMENT]: {
        segment: [Validators.required] as ValidatorFn[],
        values: null,
        name: null,
      },
      default: {
        segment: null,
        values: [Validators.required] as ValidatorFn[],
        name: [Validators.required] as ValidatorFn[],
      },
    };
    // Get the appropriate validators based on the listType, defaulting to 'default' if listType is not SEGMENT
    const validators = validatorsMap[listType] || validatorsMap['default'];
    // Apply the validators to the form fields
    Object.entries(validators).forEach(([field, validator]) => {
      this.privateSegmentListForm.get(field)?.setValidators(validator as ValidatorFn[] | null);
      this.privateSegmentListForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  valueActionButtonClicked(): void {
    console.log('valueActionButtonClicked');
  }

  // this
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
      this.formHelpersService.triggerTouchedToDisplayErrors(this.privateSegmentListForm);
    }
  }

  sendRequest(action: UPSERT_PRIVATE_SEGMENT_LIST_ACTION): void {
    const { listType, segment, values, name, description } = this.privateSegmentListForm.value;
    const newListType = listType;

    let newSegmentId = [];
    let newName = '';
    let newDescription = '';
    let newUserIds = [];
    let newGroups: Group[] = [];

    if (listType === this.LIST_TYPES.SEGMENT) {
      newSegmentId = [segment.id];
      newName = segment.name;
      newDescription = segment.description;
    } else if (listType === this.LIST_TYPES.INDIVIDUAL) {
      newName = name.trim();
      newDescription = description.trim();
      newUserIds = values;
    } else {
      newName = name.trim();
      newDescription = description.trim();
      newGroups = values.map((id: string) => ({ groupId: id, type: newListType }));
    }

    const listRequest = {
      enabled: false,
      listType: newListType,
      list: {
        name: newName,
        description: newDescription,
        context: this.config.params.sourceAppContext,
        userIds: newUserIds,
        groups: newGroups,
        subSegmentIds: newSegmentId,
        type: SEGMENT_TYPE.PRIVATE,
      },
    };

    if (action === UPSERT_PRIVATE_SEGMENT_LIST_ACTION.ADD_FLAG_INCLUDE_LIST) {
      this.segmentsService.upsertPrivateSegmentList(listRequest);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
