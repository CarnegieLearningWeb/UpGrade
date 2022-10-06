import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NewSegmentDialogData, Segment, NewSegmentDialogEvents, NewSegmentPaths, MemberTypes  } from '../../../../../core/segments/store/segments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { SEGMENT_TYPE, SEGMENT_STATUS } from 'upgrade_types';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ImportMembersComponent } from '../modal/import-members/import-members.component';

@Component({
  selector: 'segment-members',
  templateUrl: './segment-members.component.html',
  styleUrls: ['./segment-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SegmentMembersComponent implements OnInit, OnChanges {
  @Input() segmentInfo: Segment;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();
  @ViewChild('membersTable', { static: false, read: ElementRef }) membersTable: ElementRef;

  segmentMembersForm: FormGroup;
  membersDataSource = new BehaviorSubject<AbstractControl[]>([]);
  contextMetaData: IContextMetaData | {} = {};
  contextMetaDataSub: Subscription;
  allSegments: Segment[];
  allSegmentsSub: Subscription;

  segmentMemberTypes : any[];
  subSegmentIds: string[] = [];
  userIdsToSend: string[] = [];
  groupsToSend: {type: string, groupId: string}[] = [];;
  subSegmentIdsToSend = [];
  segmentNameId = new Map();
  membersCountError: string = null;
  memberImportWarning: string = null;
  groupString: string = ' ( group )';
  totalMembers = 0;

  membersDisplayedColumns = ['type', 'id', 'removeMember'];
  constructor(
    private _formBuilder: FormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService,
    private translate: TranslateService,
    private dialog: MatDialog
  ) {}

  ngOnChanges() {
    if (this.currentContext) {
      this.setMemberTypes();
    }

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.members.clear();
      this.membersDataSource.next(this.members.controls);
    }
  }

  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe(contextMetaData => {
      this.contextMetaData = contextMetaData;
    });

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe(allSegments => {
      this.allSegments =  allSegments;
    });

    if (this.allSegments) {
      this.allSegments.forEach((segment) => {
        if (this.segmentInfo) {
          if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE && segment.id !== this.segmentInfo.id) {
            this.subSegmentIds.push(segment.name);
            this.segmentNameId.set(segment.name, segment.id);
          }
        } else {
          if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE) {
            this.subSegmentIds.push(segment.name);
            this.segmentNameId.set(segment.name, segment.id);
          }
        }  
      });
    }

    this.segmentMembersForm = this._formBuilder.group({
      members: this._formBuilder.array([]),
    });

    if (this.segmentInfo) {
      this.segmentInfo.individualForSegment.forEach((id) => {
        this.members.push(this.addMembers(MemberTypes.INDIVIDUAL, id.userId));
      });
      this.segmentInfo.groupForSegment.forEach((group) => {
        this.members.push(this.addMembers(group.type, group.groupId));
      });
      this.segmentInfo.subSegments.forEach((id) => {
        this.members.push(this.addMembers(MemberTypes.SEGMENT, id.name));
      });
    }
  
    this.updateView();
  }

  openImportMembersDialog() {
    const dialogRef = this.dialog.open(ImportMembersComponent, {
      panelClass: 'import-members-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addImportMembersData(result);
        this.membersDataSource.next(this.members.controls);
        console.log("members array length:"+this.members.length);
      }
      // Code will be executed after closing dialog
    });
  }

  addMembers(type = null, id = null) {
    return this._formBuilder.group({
      type: [type , Validators.required],
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

  validateMembersCount(members: any) {
    const membersCountErrorMsg = this.translate.instant("segments.global-members.segments-count-members-error.text");
    this.membersCountError = null;
    if (members.length === 0) {
      this.membersCountError = membersCountErrorMsg;
    }
  }

  setMemberTypes() {
    this.segmentMemberTypes = [];
    this.segmentMemberTypes.push({'name': MemberTypes.INDIVIDUAL, 'value': MemberTypes.INDIVIDUAL});
    this.segmentMemberTypes.push({'name': MemberTypes.SEGMENT, 'value': MemberTypes.SEGMENT});

    if (this.currentContext === 'ALL') {
      const contexts = Object.keys(this.contextMetaData['contextMetadata']) || [];
      contexts.forEach(context => {
        this.contextMetaData['contextMetadata'][context].GROUP_TYPES.forEach(group => {
          this.segmentMemberTypes.push({'name': group + this.groupString, 'value': group});
        });
      });
    }
    else if (this.contextMetaData['contextMetadata'] && this.contextMetaData['contextMetadata'][this.currentContext]) {
      this.contextMetaData['contextMetadata'][this.currentContext].GROUP_TYPES.forEach(type => {
        this.segmentMemberTypes.push({'name': type + this.groupString, 'value': type});
      });
    }
  }

  gettingMembersValueToSend(members: {type: string, id:string}[]) {
    members.forEach(member => {
      if (member.type === MemberTypes.INDIVIDUAL) {
        this.userIdsToSend.push(member.id);
      } else if(member.type === MemberTypes.SEGMENT) {
        this.subSegmentIdsToSend.push(this.segmentNameId.get(member.id));
      } else {
        this.groupsToSend.push({ type: member.type, groupId: member.id });
      }
    });
  }

  addImportMembersData(allMembersData: string[][]) {
    allMembersData = this.validateImportMembers(allMembersData);

    allMembersData.forEach(memberData => {
      if(memberData[0] === MemberTypes.INDIVIDUAL) {
        this.members.push(this.addMembers(MemberTypes.INDIVIDUAL, memberData[1]));
      } else if(memberData[0] === MemberTypes.SEGMENT){
        this.members.push(this.addMembers(MemberTypes.SEGMENT, memberData[1]));
      } else {
        this.members.push(this.addMembers(memberData[0], memberData[1]));
      }
    });
    this.updateView();
  }

  validateImportMembers(allMembersData: string[][]) {
    const memberImportWarnigMsg = this.translate.instant("segments.members-import-warmning.text");
    this.memberImportWarning = null;

    const filtedData = allMembersData.filter(memberData => {
      return this.segmentMemberTypes.some(x => x.value === memberData[0]);
    });
    if (allMembersData.length !== filtedData.length) {
      this.memberImportWarning = memberImportWarnigMsg;
    }
    return filtedData;
  }

  // showTable() { //TODO: remove this after solving ngIf error
  //   return this.members.length;
  // }

  emitEvent(eventType: NewSegmentDialogEvents) {
    switch (eventType) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.emitSegmentDialogEvent.emit({ type: eventType });
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
        const { members } = this.segmentMembersForm.value;
        this.validateMembersCount(members);
        if (this.segmentMembersForm.valid && !this.membersCountError) {
          this.gettingMembersValueToSend(members);
          const segmentMembersFormData = {
            userIds: this.userIdsToSend,
            groups: this.groupsToSend,
            subSegmentIds: this.subSegmentIdsToSend,
            type: this.segmentInfo ? this.segmentInfo.type : SEGMENT_TYPE.PUBLIC,
            status: SEGMENT_STATUS.UNUSED
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
    return this.segmentMemberTypes;
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
  }
}
