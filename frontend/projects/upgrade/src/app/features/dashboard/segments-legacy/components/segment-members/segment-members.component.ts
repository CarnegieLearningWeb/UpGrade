import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SEGMENT_STATUS, SEGMENT_TYPE } from 'upgrade_types';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import {
  ListSegmentOption,
  MemberTypes,
  NewSegmentDialogData,
  NewSegmentDialogEvents,
  NewSegmentPaths,
  Segment,
  membersTableRowData,
} from '../../../../../core/segments/store/segments.model';

@Component({
  selector: 'segment-members',
  templateUrl: './segment-members.component.html',
  styleUrls: ['./segment-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SegmentMembersComponent implements OnInit, OnChanges {
  @Input() segmentInfo: Segment;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();
  @ViewChild('membersTable', { static: false, read: ElementRef }) membersTable: ElementRef;

  segmentMembersForm: UntypedFormGroup;
  membersDataSource = new BehaviorSubject<AbstractControl[]>([]);
  contextMetaData: IContextMetaData | Record<string, unknown> = {};
  contextMetaDataSub: Subscription;
  allSegmentOptions: ListSegmentOption[];
  allSegmentsSub = new Subscription();

  segmentMemberTypes: any[];
  subSegmentIds: string[] = [];
  userIdsToSend: string[] = [];
  allGroupTypes: string[] = [];
  groupsToSend: { type: string; groupId: string }[] = [];
  subSegmentIdsToSend = [];
  segmentNameId = new Map();
  membersCountError: string = null;
  groupString = ' ( group )';
  membersValid = true;
  isImportMemberValid = true;

  membersDisplayedColumns = ['type', 'id', 'removeMember'];
  constructor(
    private _formBuilder: UntypedFormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService,
    private translate: TranslateService
  ) {}

  get members(): UntypedFormArray {
    return this.segmentMembersForm.get('members') as UntypedFormArray;
  }

  get NewSegmentDialogEvents() {
    return NewSegmentDialogEvents;
  }

  get getMemberTypes() {
    return this.segmentMemberTypes;
  }

  ngOnChanges() {
    this.checkImportMemberValidation();

    if (this.currentContext) {
      this.selectSubSegments();
      this.setMemberTypes();
    }

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.members.clear();
      this.membersDataSource.next(this.members.controls);
    }
  }

  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
    });

    this.segmentMembersForm = this._formBuilder.group({
      members: this._formBuilder.array([this.addMembers()]),
    });

    if (this.segmentInfo) {
      this.allSegmentsSub.add(
        this.segmentsService.selectListSegmentOptionsByContext(this.segmentInfo.context).subscribe((allSegments) => {
          this.allSegmentOptions = allSegments;
        })
      );
      this.members.removeAt(0);
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

    this.segmentMembersForm.valueChanges.subscribe(() => {
      this.checkImportMemberValidation();
    });
    this.updateView();
  }

  checkImportMemberValidation() {
    if (this.segmentMembersForm?.value) {
      if (this.segmentMembersForm.value.members.length === 0) {
        this.isImportMemberValid = true;
      } else if (
        this.segmentMembersForm.value.members.length === 1 &&
        !this.segmentMembersForm.value.members[0].type &&
        !this.segmentMembersForm.value.members[0].id
      ) {
        this.isImportMemberValid = true;
      } else if (this.segmentMembersForm.value.members.length > 1) {
        const members = this.segmentMembersForm.value.members;
        for (const member of members) {
          if (!member.id && !member.type) {
            this.isImportMemberValid = true;
            continue;
          } else {
            this.isImportMemberValid = false;
            break;
          }
        }
      } else {
        this.isImportMemberValid = false;
      }
    } else {
      this.isImportMemberValid = false;
    }
  }

  selectSubSegments(): void {
    if (!this.allSegmentOptions) {
      return;
    }

    const isContextAll = this.currentContext === 'ALL';

    this.allSegmentOptions
      .filter(
        (segment) =>
          (isContextAll || segment.context === this.currentContext) &&
          (!this.segmentInfo || segment.id !== this.segmentInfo.id)
      )
      .forEach((segment) => {
        this.subSegmentIds.push(segment.name);
        this.segmentNameId.set(segment.name, segment.id);
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Process the file here. For example, upload to a server
      // Implement the file upload logic here
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        this.addCSVMembersToTable(fileContent);
        this.updateView();

        event.target.value = '';
      };
      reader.readAsText(file);
    }
  }

  addCSVMembersToTable(segmentMembers: string): void {
    if (this.members.length > 0) {
      this.members.clear();
    }
    const rows = segmentMembers.replace(/"/g, '').split('\n');
    // const fileName = segment.fileName.split('.');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowValues = row.split(',');

      // Extract the ID
      const id = rowValues[1];
      const memberType = rowValues[0]?.trim().toLowerCase();
      const memberTypeOriginal = rowValues[0]?.trim();
      if (!id || !memberType) {
        continue;
      }

      if (memberType === 'individual') {
        this.members.push(this.addMembers(MemberTypes.INDIVIDUAL, id));
      } else if (memberType === 'segment') {
        if (this.subSegmentIds.includes(id)) {
          this.members.push(this.addMembers(MemberTypes.SEGMENT, id));
        } else {
          this.members.push(this.addMembers(MemberTypes.SEGMENT, ''));
        }
      } else {
        if (this.allGroupTypes.includes(memberTypeOriginal)) {
          this.members.push(this.addMembers(memberTypeOriginal, id));
        } else if (this.allGroupTypes.includes(memberType)) {
          this.members.push(this.addMembers(memberType, id));
        } else {
          this.members.push(this.addMembers('', id));
        }
      }
    }
  }

  addMembers(type = null, id = null) {
    return this._formBuilder.group({
      type: [type, Validators.required],
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
        behavior: 'smooth',
      });
    }
  }

  validateMembers(members: membersTableRowData[]) {
    this.membersValid = true;
    members.forEach((member) => {
      if (member.type === 'Individual') {
        return;
      } else if (member.type === 'Segment') {
        if (!this.subSegmentIds.includes(member.id)) {
          this.membersValid = false;
        }
      } else if (!this.allGroupTypes.includes(member.type)) {
        this.membersValid = false;
      }
    });
  }

  validateMembersCount(members: membersTableRowData[]) {
    const membersCountErrorMsg = this.translate.instant('segments.global-members.segments-count-members-error.text');
    this.membersCountError = null;
    if (members.length === 0) {
      this.membersCountError = membersCountErrorMsg;
    }
  }

  setMemberTypes() {
    this.segmentMemberTypes = [];
    this.segmentMemberTypes.push({ name: MemberTypes.INDIVIDUAL, value: MemberTypes.INDIVIDUAL });
    this.segmentMemberTypes.push({ name: MemberTypes.SEGMENT, value: MemberTypes.SEGMENT });

    if (this.currentContext === 'ALL') {
      const contexts = Object.keys(this.contextMetaData.contextMetadata) || [];
      contexts.forEach((context) => {
        this.contextMetaData.contextMetadata[context].GROUP_TYPES.forEach((group) => {
          this.segmentMemberTypes.push({ name: group + this.groupString, value: group });
          this.allGroupTypes.push(group);
        });
      });
    } else if (this.contextMetaData.contextMetadata && this.contextMetaData.contextMetadata[this.currentContext]) {
      this.contextMetaData.contextMetadata[this.currentContext].GROUP_TYPES.forEach((type) => {
        this.segmentMemberTypes.push({ name: type + this.groupString, value: type });
        this.allGroupTypes.push(type);
      });
    }
  }

  gettingMembersValueToSend(members: { type: string; id: string }[]) {
    members.forEach((member) => {
      if (member.type === MemberTypes.INDIVIDUAL) {
        this.userIdsToSend.push(member.id);
      } else if (member.type === MemberTypes.SEGMENT) {
        this.subSegmentIdsToSend.push(this.segmentNameId.get(member.id));
      } else {
        this.groupsToSend.push({ type: member.type, groupId: member.id });
      }
    });
  }

  emitEvent(eventType: NewSegmentDialogEvents) {
    switch (eventType) {
      case NewSegmentDialogEvents.CLOSE_DIALOG:
        this.emitSegmentDialogEvent.emit({ type: eventType });
        break;
      case NewSegmentDialogEvents.SEND_FORM_DATA:
        {
          const members = this.segmentMembersForm.value.members;
          this.validateMembersCount(members);
          this.validateMembers(members);
          if (this.segmentMembersForm.valid && !this.membersCountError && this.membersValid) {
            this.gettingMembersValueToSend(members);
            const segmentMembersFormData = {
              userIds: this.userIdsToSend,
              groups: this.groupsToSend,
              subSegmentIds: this.subSegmentIdsToSend,
              type: this.segmentInfo ? this.segmentInfo.type : SEGMENT_TYPE.PUBLIC,
              status: SEGMENT_STATUS.UNUSED,
            };
            this.emitSegmentDialogEvent.emit({
              type: this.segmentInfo ? NewSegmentDialogEvents.UPDATE_SEGMENT : eventType,
              formData: segmentMembersFormData,
              path: NewSegmentPaths.SEGMENT_MEMBERS,
            });
          }
        }
        break;
    }
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
  }
}
