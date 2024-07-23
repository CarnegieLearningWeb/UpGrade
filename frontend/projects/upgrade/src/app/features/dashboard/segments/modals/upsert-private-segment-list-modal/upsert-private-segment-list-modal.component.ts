import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModalComponent } from '../../../../../shared-standalone-component-lib/components';
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
import { Observable, of } from 'rxjs';
import { S } from '@angular/cdk/keycodes';
import { SEGMENT_TYPE } from '../../../../../../../../../../types/src';
import { MatAutocomplete } from '@angular/material/autocomplete';

@Component({
  selector: 'upsert-private-segment-list-modal',
  standalone: true,
  imports: [
    CommonModalComponent,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocomplete,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './upsert-private-segment-list-modal.component.html',
  styleUrl: './upsert-private-segment-list-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPrivateSegmentListModalComponent {
  listOptionTypes$ = this.segmentsService.selectPrivateSegmentListTypeOptions$;
  // export interface Segment {
  //   createdAt: string;
  //   updatedAt: string;
  //   versionNumber: number;
  //   id: string;
  //   name: string;
  //   context: string;
  //   description: string;
  //   individualForSegment: IndividualForSegment[];
  //   groupForSegment: GroupForSegment[];
  //   subSegments: Segment[];
  //   type: SEGMENT_TYPE;
  //   status: string;
  // }
  segments$: Observable<Segment[]> = of([
    {
      createdAt: '2021-09-07T12:00:00.000Z',
      updatedAt: '2021-09-07T12:00:00.000Z',
      versionNumber: 1,
      id: '1',
      name: 'Saskatchewan schools',
      context: 'assign-prog',
      description: 'Description 1',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
      type: SEGMENT_TYPE.PUBLIC,
      status: 'active',
    },
    {
      createdAt: '2021-09-07T12:00:00.000Z',
      updatedAt: '2021-09-07T12:00:00.000Z',
      versionNumber: 1,
      id: '2',
      name: 'Texas schools',
      context: 'assign-prog',
      description: 'Description 2',
      individualForSegment: [],
      groupForSegment: [],
      subSegments: [],
      type: SEGMENT_TYPE.PUBLIC,
      status: 'active',
    },
  ]);

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
  }

  get LIST_TYPES() {
    return LIST_OPTION_TYPE;
  }

  get selectedListType() {
    return this.privateSegmentListForm.get('listType').value;
  }

  createPrivateSegmentListForm(): void {
    this.privateSegmentListForm = this.formBuilder.group({
      listType: ['', Validators.required],
      segment: [''],
    });
  }

  displaySegment(segment: Segment): string {
    return segment ? segment.name : '';
  }

  onPrimaryActionBtnClicked(): void {
    if (this.privateSegmentListForm.valid) {
      // Handle extra frontend form validation logic here?
      // TODO: create request
      console.log(this.privateSegmentListForm.value);
    } else {
      // If the form is invalid, manually mark all form controls as touched
      this.formHelpersService.triggerTouchedToDisplayErrors(this.privateSegmentListForm);
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
