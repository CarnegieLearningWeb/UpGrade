import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import {
  Segment,
  NewSegmentDialogEvents,
  NewSegmentDialogData,
  NewSegmentPaths,
} from '../../../../../core/segments/store/segments.model';
import { IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { SEGMENT_TYPE } from 'upgrade_types';
import { SegmentsService } from '../../../../../core/segments/segments.service';

@Component({
  selector: 'segment-overview',
  templateUrl: './segment-overview.component.html',
  styleUrls: ['./segment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SegmentOverviewComponent implements OnInit, OnDestroy {
  @Input() segmentInfo: Segment;
  @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();

  overviewForm: UntypedFormGroup;
  allContexts = [];
  currentContext = null;
  isSegmentNameValid = true;

  allSegmentNameContextArray: string[] = [];
  allSegments: Segment[];
  allSegmentsSub: Subscription;
  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private experimentService: ExperimentService,
    private segmentsService: SegmentsService
  ) {}

  get NewSegmentDialogEvents() {
    return NewSegmentDialogEvents;
  }

  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;

      if (this.contextMetaData && this.contextMetaData.contextMetadata) {
        this.allContexts = Object.keys(this.contextMetaData.contextMetadata);
      }
    });

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe((allSegments) => {
      this.allSegments = allSegments;
    });

    this.overviewForm = this._formBuilder.group({
      name: [null, Validators.required],
      description: [null],
      context: [null, Validators.required],
    });

    this.overviewForm.get('context').valueChanges.subscribe((context) => {
      this.currentContext = context;
    });

    // populate values in form to update segment if segment data is available
    if (this.segmentInfo) {
      this.overviewForm.setValue({
        name: this.segmentInfo.name,
        description: this.segmentInfo.description,
        context: this.segmentInfo.context,
      });
    }

    if (this.segmentInfo && this.segmentInfo.type === SEGMENT_TYPE.GLOBAL_EXCLUDE) {
      this.allContexts.push(this.segmentInfo.context);
      this.overviewForm.disable();
    }
  }

  SegmentNameValidation(name: string, context: string) {
    this.allSegmentNameContextArray = [];
    this.isSegmentNameValid = true;
    this.allSegmentNameContextArray = this.allSegments.map((segment) => {
      if (this.segmentInfo) {
        if (this.segmentInfo.id === segment.id) {
          return '';
        }
      }
      return segment.name + '_' + segment.context;
    });
    const segmentNameContextString = name.trim() + '_' + context;
    if (this.allSegmentNameContextArray.includes(segmentNameContextString)) {
      this.isSegmentNameValid = false;
    }
  }

  emitEvent(eventType: NewSegmentDialogEvents) {
    switch (eventType) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.emitSegmentDialogEvent.emit({ type: eventType });
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
        this.SegmentNameValidation(this.overviewForm.value.name, this.overviewForm.value.context);
        if ((this.overviewForm.valid || this.overviewForm.disabled) && this.isSegmentNameValid) {
          const { name, description, context } = this.overviewForm.value;
          const overviewFormData = {
            name,
            description: description || '',
            context,
          };
          this.emitSegmentDialogEvent.emit({
            type: eventType,
            formData: overviewFormData,
            path: NewSegmentPaths.SEGMENT_OVERVIEW,
          });
        }
        break;
    }
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
  }
}
