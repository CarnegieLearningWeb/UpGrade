import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal-config';
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
  LIST_OPTION_TYPE,
  Segment,
  UpsertPrivateSegmentListParams,
} from '../../../../../core/segments/store/segments.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, Subscription } from 'rxjs';
import { SegmentsModule } from '../../segments.module';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';

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

  subscriptions = new Subscription();
  segmentFilteredByContext$ = this.segmentsService.getSegmentsByContext(this.config.params.sourceAppContext);
  isFormValid$: Observable<boolean>;
  isPrimaryButtonDisabled$: Observable<boolean>;

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
    this.segmentFilteredByContext$.subscribe((segments) => {
      console.log('>> segments', segments);
    });
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

    // Subscribe to changes in listType
    this.privateSegmentListForm.get('listType').valueChanges.subscribe((type) => {
      const currentListType = type; // Store the current listType value

      // Reset all fields, but preserve the listType value
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
      if (type === this.LIST_TYPES.SEGMENT) {
        // If listType is SEGMENT, segment is required
        this.privateSegmentListForm.get('segment').setValidators([Validators.required]);
        this.privateSegmentListForm.get('values').setValidators(null); // Not required
        this.privateSegmentListForm.get('name').setValidators(null); // Not required
      } else {
        // For other types, values and name are required
        this.privateSegmentListForm.get('segment').setValidators(null); // Not required
        this.privateSegmentListForm.get('values').setValidators([Validators.required]);
        this.privateSegmentListForm.get('name').setValidators([Validators.required]);
      }

      // Update validity
      this.privateSegmentListForm.get('segment').updateValueAndValidity({ emitEvent: false });
      this.privateSegmentListForm.get('values').updateValueAndValidity({ emitEvent: false });
      this.privateSegmentListForm.get('name').updateValueAndValidity({ emitEvent: false });
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
      this.sendRequest();
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.privateSegmentListForm);
    }
  }

  sendRequest(): void {
    const { listType, segment, values } = this.privateSegmentListForm.value;
    let { name, description } = this.privateSegmentListForm.value;
    if (listType === this.LIST_TYPES.SEGMENT) {
      name = segment.name;
      description = segment.description;
    }
    const listRequest = {
      enabled: false,
      listType,
      list: {
        name,
        description,
        context: 'mathstream',
        userIds: [],
        groups: [],
        subSegmentIds: [segment.id],
        type: SEGMENT_TYPE.PRIVATE,
      },
    };
    console.log('>> listRequest', listRequest);
    this.segmentsService.upsertPrivateSegmentList(listRequest);
  }

  closeModal() {
    this.dialogRef.close();
  }
}
