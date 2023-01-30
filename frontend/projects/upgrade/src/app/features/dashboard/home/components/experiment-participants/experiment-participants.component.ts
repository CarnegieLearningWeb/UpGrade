import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM,
  IContextMetaData,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Segment, MemberTypes } from '../../../../../core/segments/store/segments.model';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { SEGMENT_TYPE, FILTER_MODE } from 'upgrade_types';
import { INCLUSION_CRITERIA } from 'upgrade_types';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';

@Component({
  selector: 'home-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentParticipantsComponent implements OnInit {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('members1Table', { static: false, read: ElementRef }) members1Table: ElementRef;
  @ViewChild('members2Table', { static: false, read: ElementRef }) members2Table: ElementRef;

  participantsForm: FormGroup;
  participantsForm2: FormGroup;
  members1DataSource = new BehaviorSubject<AbstractControl[]>([]);
  members2DataSource = new BehaviorSubject<AbstractControl[]>([]);

  inclusionCriteria = [{ value: INCLUSION_CRITERIA.INCLUDE_SPECIFIC }, { value: INCLUSION_CRITERIA.EXCEPT }];
  membersDisplayedColumns = ['type', 'id', 'removeMember'];

  enableSave = true;
  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;
  allSegments: Segment[];
  allSegmentsSub: Subscription;
  subSegmentIds = [];
  segmentNameId = new Map();
  subSegmentTypes: any[];
  subSegmentIdsToSend = [];
  userIdsToSend = [];
  groupsToSend = [];
  groupString = ' ( group )';

  constructor(
    private _formBuilder: FormBuilder,
    private _formBuilder2: FormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService,
    private dialogService: DialogService,
    private experimentDesignStepperService: ExperimentDesignStepperService
  ) {}

  ngOnChanges() {
    if (this.currentContext) {
      this.subSegmentIds = [];
      if (this.allSegments) {
        this.allSegments.forEach((segment) => {
          if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE && segment.context === this.currentContext) {
            this.subSegmentIds.push(segment.name);
            this.segmentNameId.set(segment.name, segment.id);
          }
        });
      }
      this.setMemberTypes();
    }

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.members1.clear();
      this.members2.clear();
      this.members1DataSource.next(this.members1.controls);
      this.members2DataSource.next(this.members2.controls);
    }
  }

  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
    });

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe((allSegments) => {
      this.allSegments = allSegments;
    });

    this.participantsForm = this._formBuilder.group({
      inclusionCriteria: [null],
      except: [null],
      members1: this._formBuilder.array([this.addMembers1()]),
    });

    this.participantsForm2 = this._formBuilder2.group({
      members2: this._formBuilder.array([this.addMembers2()]),
    });

    this.participantsForm.get('inclusionCriteria').setValue(INCLUSION_CRITERIA.INCLUDE_SPECIFIC);

    if (this.experimentInfo) {
      if (this.experimentInfo.filterMode === FILTER_MODE.EXCLUDE_ALL) {
        this.participantsForm.get('inclusionCriteria').setValue(INCLUSION_CRITERIA.INCLUDE_SPECIFIC);
        this.experimentInfo.experimentSegmentInclusion.segment.individualForSegment.forEach((id) => {
          this.members1.push(this.addMembers1(MemberTypes.INDIVIDUAL, id.userId));
        });
        this.experimentInfo.experimentSegmentInclusion.segment.groupForSegment.forEach((group) => {
          this.members1.push(this.addMembers1(group.type, group.groupId));
        });
        this.experimentInfo.experimentSegmentInclusion.segment.subSegments.forEach((id) => {
          this.members1.push(this.addMembers1(MemberTypes.SEGMENT, id.name));
        });
        this.experimentInfo.experimentSegmentExclusion.segment.individualForSegment.forEach((id) => {
          this.members2.push(this.addMembers2(MemberTypes.INDIVIDUAL, id.userId));
        });
        this.experimentInfo.experimentSegmentExclusion.segment.groupForSegment.forEach((group) => {
          this.members2.push(this.addMembers2(group.type, group.groupId));
        });
        this.experimentInfo.experimentSegmentExclusion.segment.subSegments.forEach((id) => {
          this.members2.push(this.addMembers2(MemberTypes.SEGMENT, id.name));
        });
      } else {
        this.participantsForm.get('inclusionCriteria').setValue(INCLUSION_CRITERIA.EXCEPT);
        this.experimentInfo.experimentSegmentExclusion.segment.individualForSegment.forEach((id) => {
          this.members1.push(this.addMembers1(MemberTypes.INDIVIDUAL, id.userId));
        });
        this.experimentInfo.experimentSegmentExclusion.segment.groupForSegment.forEach((group) => {
          this.members1.push(this.addMembers1(group.type, group.groupId));
        });
        this.experimentInfo.experimentSegmentExclusion.segment.subSegments.forEach((id) => {
          this.members1.push(this.addMembers1(MemberTypes.SEGMENT, id.name));
        });
      }

      this.members1.removeAt(0);
      this.members2.removeAt(0);
    }

    this.updateView1();
    this.updateView2();
  }

  addMembers1(type = null, id = null) {
    return this._formBuilder.group({
      type: [type, Validators.required],
      id: [id, Validators.required],
    });
  }

  addMembers2(type = null, id = null) {
    return this._formBuilder.group({
      type: [type, Validators.required],
      id: [id, Validators.required],
    });
  }

  addMember1() {
    this.members1.push(this.addMembers1());
    this.updateView1();
  }

  addMember2() {
    this.members2.push(this.addMembers2());
    this.updateView2();
  }

  removeMember1(groupIndex: number) {
    this.members1.removeAt(groupIndex);
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.updateView1();
  }

  removeMember2(groupIndex: number) {
    this.members2.removeAt(groupIndex);
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.updateView2();
  }

  updateView1() {
    this.members1DataSource.next(this.members1.controls);
    if (this.members1Table) {
      this.members1Table.nativeElement.scroll({
        top: this.members1Table.nativeElement.scrollHeight - 94,
        behavior: 'smooth',
      });
    }
  }

  updateView2() {
    this.members2DataSource.next(this.members2.controls);
    if (this.members2Table) {
      this.members2Table.nativeElement.scroll({
        top: this.members2Table.nativeElement.scrollHeight - 94,
        behavior: 'smooth',
      });
    }
  }

  setMemberTypes() {
    this.subSegmentTypes = [];
    this.subSegmentTypes.push({ name: MemberTypes.INDIVIDUAL, value: MemberTypes.INDIVIDUAL });
    this.subSegmentTypes.push({ name: MemberTypes.SEGMENT, value: MemberTypes.SEGMENT });
    if (this.contextMetaData.contextMetadata && this.contextMetaData.contextMetadata[this.currentContext]) {
      this.contextMetaData.contextMetadata[this.currentContext].GROUP_TYPES.forEach((type) => {
        this.subSegmentTypes.push({ name: type + this.groupString, value: type });
      });
    }
  }

  handleBackBtnClick() {
    return (
      (this.participantsForm.dirty || this.participantsForm2.dirty) &&
      this.experimentDesignStepperService.experimentStepperDataChanged()
    );
  }

  gettingMembersValueToSend(members: any) {
    this.userIdsToSend = [];
    this.subSegmentIdsToSend = [];
    this.groupsToSend = [];
    const memberFiltered = members.filter((member) => member.type);
    memberFiltered.forEach((member) => {
      if (member.type === MemberTypes.INDIVIDUAL) {
        this.userIdsToSend.push(member.id);
      } else if (member.type === MemberTypes.SEGMENT) {
        this.subSegmentIdsToSend.push(this.segmentNameId.get(member.id));
      } else {
        this.groupsToSend.push({ type: member.type, groupId: member.id });
      }
    });
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (
          this.participantsForm.dirty ||
          this.participantsForm2.dirty ||
          this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()
        ) {
          this.dialogService
            .openConfirmDialog()
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.emitExperimentDialogEvent.emit({ type: eventType });
              }
            });
        } else {
          this.emitExperimentDialogEvent.emit({ type: eventType });
        }
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        if (this.participantsForm.dirty || this.participantsForm2.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        this.saveData(eventType);
        break;
    }
  }

  saveData(eventType) {
    this.participantsForm.markAllAsTouched();
    this.participantsForm2.markAllAsTouched();

    const filterMode =
      this.participantsForm.get('inclusionCriteria').value === INCLUSION_CRITERIA.INCLUDE_SPECIFIC
        ? FILTER_MODE.EXCLUDE_ALL
        : FILTER_MODE.INCLUDE_ALL;

    if (filterMode === FILTER_MODE.INCLUDE_ALL) {
      this.members2.clear();
    }

    const { members1 } = this.participantsForm.value;
    const { members2 } = this.participantsForm2.value;

    // TODO: Handle member2:
    if (this.participantsForm.valid && this.participantsForm2.valid) {
      this.gettingMembersValueToSend(members1);
      const segmentMembers1FormData = {
        userIds: this.userIdsToSend,
        groups: this.groupsToSend,
        subSegmentIds: this.subSegmentIdsToSend,
        type: SEGMENT_TYPE.PRIVATE,
      };

      // if dropdown is includeall except then members2.clear()
      this.gettingMembersValueToSend(members2);
      const segmentMembers2FormData = {
        userIds: this.userIdsToSend,
        groups: this.groupsToSend,
        subSegmentIds: this.subSegmentIdsToSend,
        type: SEGMENT_TYPE.PRIVATE,
      };
      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData:
          filterMode === FILTER_MODE.EXCLUDE_ALL
            ? {
                experimentSegmentInclusion: segmentMembers1FormData,
                experimentSegmentExclusion: segmentMembers2FormData,
                filterMode: filterMode,
              }
            : {
                experimentSegmentInclusion: segmentMembers2FormData,
                experimentSegmentExclusion: segmentMembers1FormData,
                filterMode: filterMode,
              },
        path: NewExperimentPaths.EXPERIMENT_PARTICIPANTS,
      });

      if(eventType==NewExperimentDialogEvents.SAVE_DATA){
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.participantsForm.markAsPristine();
        this.participantsForm2.markAsPristine();
      }
    }
  }

  get members1(): FormArray {
    return this.participantsForm.get('members1') as FormArray;
  }

  get members2(): FormArray {
    return this.participantsForm2.get('members2') as FormArray;
  }

  get getMemberTypes() {
    return this.subSegmentTypes;
  }

  get inclusionCriterisAsIncludeSpecific() {
    return this.participantsForm.get('inclusionCriteria').value === INCLUSION_CRITERIA.INCLUDE_SPECIFIC;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
  }
}
