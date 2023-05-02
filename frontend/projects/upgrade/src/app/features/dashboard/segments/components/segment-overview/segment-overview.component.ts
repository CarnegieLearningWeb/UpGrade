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

@Component({
  selector: 'segment-overview',
  templateUrl: './segment-overview.component.html',
  styleUrls: ['./segment-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentOverviewComponent implements OnInit, OnDestroy {
  @Input() segmentInfo: Segment;
  @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();

  overviewForm: UntypedFormGroup;
  allContexts = [];
  currentContext = null;

  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;

  constructor(private _formBuilder: UntypedFormBuilder, private experimentService: ExperimentService) {}

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

  emitEvent(eventType: NewSegmentDialogEvents) {
    switch (eventType) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.emitSegmentDialogEvent.emit({ type: eventType });
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
        if (this.overviewForm.valid || this.overviewForm.disabled) {
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
  }
}
