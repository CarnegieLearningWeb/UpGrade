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
import { BehaviorSubject, Observable, map, startWith, Subscription, combineLatestWith, withLatestFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModalConfig } from '../../../../../shared-standalone-component-lib/components/common-modal/common-modal.types';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { DuplicateSegmentNameError, SEGMENT_TYPE } from 'upgrade_types';
import isEqual from 'lodash.isequal';
import { SharedModule } from '../../../../../shared/shared.module';

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
    SharedModule,
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
  initialFormValues$ = new BehaviorSubject<SegmentFormData>(null);
  subscriptions = new Subscription();
  isContextChanged = false;
  initialContext = '';
  isInitialFormValueChanged$: Observable<boolean>;
  duplicateSegmentNameError$ = this.segmentService.duplicateSegmentNameError$;

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
    this.listenForIsInitialFormValueChanged();
    this.listenForPrimaryButtonDisabled();
    this.listenOnContext();
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
    this.disableRestrictedFields();

    this.initialFormValues$.next(this.segmentForm.value);

    this.listenForDuplicateNameError();
    this.listenForNameChanges();
  }

  disableRestrictedFields(): void {
    if (
      this.config.params.action === UPSERT_SEGMENT_ACTION.EDIT &&
      this.config.params.sourceSegment.status === SEGMENT_STATUS.USED
    ) {
      this.appContextControl.disable();
      this.nameControl.disable();
    }

    if (this.config.params.action === UPSERT_SEGMENT_ACTION.DUPLICATE) {
      this.appContextControl.enable();
    }
  }

  private updateNameControlErrors(shouldSetDuplicateError: boolean, error?: DuplicateSegmentNameError) {
    const currentErrors = this.nameControl.errors || {};
    const { duplicateSegmentName, ...otherErrors } = currentErrors;

    if (shouldSetDuplicateError && error) {
      this.nameControl.setErrors({ ...otherErrors, duplicateSegmentName: error });
    } else if (currentErrors.duplicateSegmentName) {
      this.nameControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
    }
  }

  setDuplicateSegmentNameErrorOnNameControl(error: DuplicateSegmentNameError) {
    this.updateNameControlErrors(!!error, error);
  }

  handleCheckingDuplicateName(error: DuplicateSegmentNameError, nameInput: string) {
    const contextInput = this.appContextControl.value;
    const isDuplicate = nameInput === error?.duplicateName && contextInput === error?.context;
    this.updateNameControlErrors(isDuplicate, error);
  }

  get nameControl() {
    return this.segmentForm.get('name');
  }

  get appContextControl() {
    return this.segmentForm.get('appContext');
  }

  deriveInitialFormValues(sourceSegment: Segment, action: UPSERT_SEGMENT_ACTION): SegmentFormData {
    let name = '';
    if (action === UPSERT_SEGMENT_ACTION.DUPLICATE) {
      name = `${sourceSegment?.name} (COPY)`;
    }

    if (action === UPSERT_SEGMENT_ACTION.EDIT) {
      name = sourceSegment?.name;
    }

    const description = sourceSegment?.description || '';
    const appContext = sourceSegment?.context || '';
    const tags = sourceSegment?.tags || [];
    return { name, description, appContext, tags };
  }

  listenForPrimaryButtonDisabled() {
    this.isPrimaryButtonDisabled$ = this.isLoadingUpsertSegment$.pipe(
      combineLatestWith(this.isInitialFormValueChanged$),
      map(
        ([isLoading, isInitialFormValueChanged]) =>
          isLoading ||
          this.segmentForm.invalid ||
          (!isInitialFormValueChanged && this.config.params.action !== UPSERT_SEGMENT_ACTION.DUPLICATE)
      )
    );
    this.subscriptions.add(this.isPrimaryButtonDisabled$.subscribe());
  }

  listenForNameChanges(): void {
    this.subscriptions.add(
      this.nameControl.valueChanges
        .pipe(withLatestFrom(this.duplicateSegmentNameError$))
        .subscribe(([name, error]) => this.handleCheckingDuplicateName(error, name))
    );
  }

  listenForDuplicateNameError(): void {
    this.subscriptions.add(
      this.duplicateSegmentNameError$.subscribe((error) => this.setDuplicateSegmentNameErrorOnNameControl(error))
    );
  }

  listenOnContext(): void {
    this.subscriptions.add(
      this.appContextControl?.valueChanges.subscribe((context) => {
        this.isContextChanged = context !== this.initialContext;
        this.handleCheckingDuplicateName(this.duplicateSegmentNameError$.value, this.nameControl.value);
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
      this.segmentService.setDuplicateSegmentNameError(null);
      this.sendRequest(this.config.params.action, this.config.params.sourceSegment);
    } else {
      CommonFormHelpersService.triggerTouchedToDisplayErrors(this.segmentForm);
    }
  }

  sendRequest(action: UPSERT_SEGMENT_ACTION, sourceSegment?: Segment): void {
    const formData: SegmentFormData = this.segmentForm.value;
    if (action === UPSERT_SEGMENT_ACTION.ADD) {
      this.createAddRequest(formData);
    } else if (action === UPSERT_SEGMENT_ACTION.EDIT && sourceSegment) {
      this.createEditRequest(formData, sourceSegment);
    } else if (action === UPSERT_SEGMENT_ACTION.DUPLICATE && sourceSegment) {
      this.createDuplicateRequest(formData, sourceSegment);
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
    const { id, status, type } = sourceSegment;
    const subSegmentIds = sourceSegment.subSegments.map((subSegment) => subSegment.id);

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
      subSegmentIds,
      status,
      type,
      tags,
    };
    this.segmentService.modifySegment(segmentRequest);
  }

  createDuplicateRequest({ name, description, tags }: SegmentFormData, sourceSegment: Segment): void {
    const subSegmentIds = sourceSegment.subSegments.map((subSegment) => subSegment.id);

    const segmentRequest: AddSegmentRequest = {
      name,
      description,
      context: sourceSegment.context,
      userIds: [],
      groups: [],
      subSegmentIds,
      status: SEGMENT_STATUS.UNUSED,
      type: SEGMENT_TYPE.PUBLIC,
      tags,
    };
    this.segmentService.addSegment(segmentRequest);
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
