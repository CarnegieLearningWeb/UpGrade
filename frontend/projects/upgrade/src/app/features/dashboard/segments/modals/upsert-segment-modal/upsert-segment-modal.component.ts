import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  CommonModalComponent,
  CommonTagsInputComponent,
} from '../../../../../shared-standalone-component-lib/components';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonFormHelpersService } from '../../../../../shared/services/common-form-helpers.service';
import {
  CommonTagInputType,
  Segment,
  SEGMENT_STATUS,
  SegmentFormData,
  UPSERT_SEGMENT_ACTION,
  UpsertSegmentParams,
  AddSegmentRequest,
  UpdateSegmentRequest,
} from '../../../../../core/segments/store/segments.model';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { BehaviorSubject, Observable, map, startWith, Subscription, combineLatestWith } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import isEqual from 'lodash.isequal';

@Component({
  selector: 'upsert-add-segment-modal',
  imports: [
    CommonModalComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonTagsInputComponent,
  ],
  templateUrl: './upsert-segment-modal.component.html',
  styleUrl: './upsert-segment-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertSegmentModalComponent {
  segmentForm: FormGroup;
  isLoadingUpsertSegment$ = this.segmentService.isLoadingUpsertSegment$;
  isPrimaryButtonDisabled$: Observable<boolean>;
  appContexts$ = this.segmentService.appContexts$;
  CommonTagInputType = CommonTagInputType;
  isSelectedSegmentUpdated$ = this.segmentService.isSelectedSegmentUpdated$;
  initialFormValues$ = new BehaviorSubject<SegmentFormData>(null);
  subscriptions = new Subscription();
  isContextChanged = false;
  initialContext = '';
  isInitialFormValueChanged$: Observable<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public config: CommonModalConfig<UpsertSegmentParams>,
    private formBuilder: FormBuilder,
    private segmentService: SegmentsService,
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<UpsertSegmentModalComponent>
  ) {}

  ngOnInit(): void {
    this.experimentService.fetchContextMetaData();
    this.createSegmentForm();
    this.listenForSegmentGetUpdated();
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
    this.listenOnContext();

    if (this.isDisabled()) {
      this.disableRestrictedFields();
    }
  }

  isDisabled() {
    return (
      this.config.params.action === UPSERT_SEGMENT_ACTION.EDIT &&
      this.config.params.sourceSegment?.status === SEGMENT_STATUS.USED
    );
  }

  disableRestrictedFields(): void {
    this.segmentForm.get('name')?.disable();
    this.segmentForm.get('appContext')?.disable();
  }

  createSegmentForm(): void {
    const { sourceSegment, action } = this.config.params;
    const initialValues = this.deriveInitialFormValues(sourceSegment, action);
    this.initialContext = initialValues.appContext;

    this.segmentForm = this.formBuilder.group({
      name: [initialValues.name, Validators.required],
      description: [initialValues.description],
      appContext: [initialValues.appContext, Validators.required],
      tags: [initialValues.tags],
    });

    this.initialFormValues$.next(this.segmentForm.value);
  }

  deriveInitialFormValues(sourceSegment: any, action: string): SegmentFormData {
    const name = action === UPSERT_SEGMENT_ACTION.EDIT ? sourceSegment?.name : '';
    const description = sourceSegment?.description || '';
    const appContext = sourceSegment?.context || '';
    const tags = sourceSegment?.tags || [];
    return { name, description, appContext, tags };
  }

  listenForPrimaryButtonDisabled() {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertSegment$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(([isLoading, isInitialFormValueChanged]) => isLoading || !isInitialFormValueChanged)
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  // Close the modal once the feature flag list length changes, as that indicates actual success
  listenForSegmentGetUpdated(): void {
    this.subscriptions.add(
      this.isSelectedSegmentUpdated$.subscribe(() => {
        this.closeModal();
      })
    );
  }

  listenOnContext(): void {
    this.subscriptions.add(
      this.segmentForm.get('appContext')?.valueChanges.subscribe((context) => {
        this.isContextChanged = context !== this.initialContext;
      })
    );
  }

  listenForIsInitialFormValueChanged() {
    this.isInitialFormValueChanged$ = this.segmentForm.valueChanges.pipe(
      startWith(this.segmentForm.value),
      map(() => !isEqual(this.segmentForm.value, this.initialFormValues$.value))
    );
    this.subscriptions.add(this.isInitialFormValueChanged$.subscribe());
  }

  onPrimaryActionBtnClicked() {
    if (this.segmentForm.valid) {
      this.sendRequest(this.config.params.action, this.config.params.sourceSegment);
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.segmentForm);
    }
  }

  sendRequest(action: UPSERT_SEGMENT_ACTION, sourceSegment?: Segment): void {
    const formData: SegmentFormData = this.segmentForm.value;
    if (action === UPSERT_SEGMENT_ACTION.ADD || action === UPSERT_SEGMENT_ACTION.DUPLICATE) {
      this.createAddRequest(formData);
    } else if (action === UPSERT_SEGMENT_ACTION.EDIT && sourceSegment) {
      this.createEditRequest(formData, sourceSegment);
    } else {
      console.error('UpsertSegmentModalComponent: sendRequest: Invalid action or missing sourceSegment');
    }
  }

  createAddRequest({ name, description, appContext, tags }: SegmentFormData): void {
    const segmentRequest: AddSegmentRequest = {
      name,
      description,
      context: appContext,
      userIds: [],
      groups: [],
      subSegmentIds: [],
      status: SEGMENT_STATUS.UNUSED,
      type: SEGMENT_TYPE.PUBLIC,
      tags,
    };
    this.segmentService.addSegment(segmentRequest);
  }

  createEditRequest({ name, description, appContext, tags }: SegmentFormData, sourceSegment: Segment): void {
    const { id, status } = sourceSegment;
    // Not allow editing segment name and context if segment is in used status:
    if (sourceSegment.status === SEGMENT_STATUS.USED) {
      name = sourceSegment.name;
      appContext = sourceSegment.context;
    }
    const segmentRequest: UpdateSegmentRequest = {
      id,
      name,
      description,
      context: appContext,
      userIds: [],
      groups: [],
      subSegmentIds: [],
      status,
      type: SEGMENT_TYPE.PUBLIC,
      tags,
    };
    this.segmentService.modifySegment(segmentRequest);
  }

  get UPSERT_SEGMENT_ACTION() {
    return UPSERT_SEGMENT_ACTION;
  }

  closeModal() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
