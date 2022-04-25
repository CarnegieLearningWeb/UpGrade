import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NewSegmentDialogData, SegmentVM, NewSegmentDialogEvents, NewSegmentPaths, MemberTypes  } from '../../../../../core/segments/store/segments.model';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { SEGMENT_TYPE } from 'upgrade_types';

@Component({
  selector: 'segment-members',
  templateUrl: './segment-members.component.html',
  styleUrls: ['./segment-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentMembersComponent implements OnInit, OnChanges {
  @Input() segmentInfo: SegmentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();
  @ViewChild('membersTable', { static: false, read: ElementRef }) membersTable: ElementRef;

  segmentMembersForm: FormGroup;
  membersDataSource = new BehaviorSubject<AbstractControl[]>([]);
  contextMetaData: IContextMetaData | {} = {};
  contextMetaDataSub: Subscription;
  memberTypes = [];
  memberTypesDum : any[];
  subSegmentIds = ['subsegment1', 'subsegment2', 'subsegment3'];
  userIdsToSend = [];
  groupsToSend = [];
  subSegmentIdsToSend = [];

  membersDisplayedColumns = [ 'memberNumber', 'type', 'id', 'removeMember'];
  constructor(
    private _formBuilder: FormBuilder,
    private featureFlagService: FeatureFlagsService,
    private experimentService: ExperimentService
  ) {}
  
  ngOnChanges(changes: SimpleChanges) {
    // console.log(' the data of context from child1 is,  ngonchanges', this.currentContext);
    if(this.currentContext) {
      this.setMemberTypes();
    }
    // console.log(' this data present in child2 is ,', this.segmentInfo);
    if(this.isContextChanged) {
      this.isContextChanged = false;
      this.members.clear();
      this.membersDataSource.next(this.members.controls);
    }
  }
  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe(contextMetaData => {
      this.contextMetaData = contextMetaData;
    });
    // console.log(' the data of context from child1 is,  ngoninit', this.currentContext);

    this.segmentMembersForm = this._formBuilder.group({
      members: this._formBuilder.array([]),
      // type: [null, Validators.required],
      // id: [null, Validators.required]
    });

    if (this.segmentInfo) {
       this.segmentInfo.userIds.forEach((userId) => {
         this.members.push(this.addMembers(MemberTypes.INDIVIDUAL, userId));
       });
       this.segmentInfo.groups.forEach((group) => {
        this.members.push(this.addMembers(group.type, group.groupId));
      });
      this.segmentInfo.subSegmentIds.forEach((subSegmentId) => {
        this.members.push(this.addMembers(MemberTypes.SEGMENT, subSegmentId));
      });
    }
  }

  addMembers(type = null, id = null) {
    return this._formBuilder.group({
      type: [ type , Validators.required],
      id: [id, Validators.required],
    });
  }

  addMember() {
    this.members.push(this.addMembers());
    this.updateView();
  }

  removeMember(groupIndex: number) {
    this.members.removeAt(groupIndex);
    this.updateView();
  }

  updateView() {
    this.membersDataSource.next(this.members.controls);
    if (this.membersTable) {
      this.membersTable.nativeElement.scroll({
        top: this.membersTable.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  setMemberTypes() {
    this.memberTypes = [];
    this.memberTypesDum = [];
    this.memberTypes.push({ value: MemberTypes.INDIVIDUAL});
    this.memberTypesDum.push({ heading: '', value: [MemberTypes.INDIVIDUAL]});
    this.memberTypesDum.push({ heading: '', value: [MemberTypes.SEGMENT]});
    const arr = [];
    this.memberTypes.push({ value: MemberTypes.SEGMENT});
    if (this.contextMetaData['contextMetadata'] && this.contextMetaData['contextMetadata'][this.currentContext]) {
      this.contextMetaData['contextMetadata'][this.currentContext].GROUP_TYPES.forEach(type => {
        this.memberTypes.push({ value: type });
        arr.push(type);
      });
    }
    this.memberTypesDum.push({ heading: 'group', value: arr});
    console.log(' the memberType data is --------------', this.memberTypesDum);
  }

  foo(members: any) {
    // rename this function
    members.forEach(member => {
      if(member.type === MemberTypes.INDIVIDUAL) {
        this.userIdsToSend.push(member.id);
      }
      else if(member.type === MemberTypes.SEGMENT) {
        this.subSegmentIdsToSend.push(member.id);
      }
      else {
        this.groupsToSend.push({ type: member.type, groupId: member.id });
      }
    });
  }

  emitEvent(eventType: NewSegmentDialogEvents) {
    // console.log(' inside the emitEvent type, ' );
    switch (eventType) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.emitSegmentDialogEvent.emit({ type: eventType });
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
        if (this.segmentMembersForm.valid) {
          const { members } = this.segmentMembersForm.value;
          console.log(' the data that being sent from segmentMembersForm is ---', this.segmentMembersForm.getRawValue())
          this.foo(members)
          const segmentMembersFormData = {
            userIds: this.userIdsToSend,
            groups: this.groupsToSend,
            subSegmentIds: this.subSegmentIdsToSend,
            type: SEGMENT_TYPE.PUBLIC
          }
          this.emitSegmentDialogEvent.emit({
            type: this.segmentInfo ? NewSegmentDialogEvents.UPDATE_SEGMENT : eventType,
            formData: segmentMembersFormData,
            path: NewSegmentPaths.SEGMENT_MEMBERS
          });
        }
      break;
    }
  }

  get members(): FormArray {
    return this.segmentMembersForm.get('members') as FormArray;
  }

  get NewSegmentDialogEvents() {
    return NewSegmentDialogEvents;
  }

  get getMemberTypes() {
    return this.memberTypes;
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
  }
}
