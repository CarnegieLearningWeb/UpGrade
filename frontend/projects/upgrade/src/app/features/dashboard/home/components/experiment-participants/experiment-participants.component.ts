import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM, ExperimentCondition, ExperimentPartition, IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { NewSegmentDialogData, Segment, NewSegmentDialogEvents, NewSegmentPaths, MemberTypes  } from '../../../../../core/segments/store/segments.model';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { SEGMENT_TYPE, FILTER_MODE } from 'upgrade_types';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'home-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentParticipantsComponent implements OnInit {
  // @Input() segmentInfo: Segment;
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  // @Output() emitSegmentDialogEvent = new EventEmitter<NewSegmentDialogData>();
  @ViewChild('members1Table', { static: false, read: ElementRef }) members1Table: ElementRef;
  @ViewChild('members2Table', { static: false, read: ElementRef }) members2Table: ElementRef;

  participantsForm: FormGroup;
  participantsForm2: FormGroup;
  members1DataSource = new BehaviorSubject<AbstractControl[]>([]);
  members2DataSource = new BehaviorSubject<AbstractControl[]>([]);

  inclusionCriteria = [{ value: 'Include Specific'}, { value: 'Include All Except...'}];
  membersDisplayedColumns = [ 'memberNumber', 'type', 'id', 'removeMember' ];

  contextMetaData: IContextMetaData | {} = {};
  contextMetaDataSub: Subscription;
  allSegments: Segment[];
  allSegmentsSub: Subscription;
  subSegmentIds = [];
  segmentNameId = new Map();
  subSegmentTypes: any[];
  subSegmentIdsToSend = [];
  membersCountError: string = null;
  userIdsToSend = [];
  groupsToSend = [];

  constructor(
    private _formBuilder: FormBuilder,
    private _formBuilder2: FormBuilder,
    private segmentsService: SegmentsService,
    private experimentService: ExperimentService
  ) { }

  ngOnChanges() {
    if (this.currentContext) {
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
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe(contextMetaData => {
      this.contextMetaData = contextMetaData;
    });

    this.allSegmentsSub = this.segmentsService.allSegments$.subscribe(allSegments => {
      this.allSegments =  allSegments;
    });
 
    if (this.allSegments) {
      this.allSegments.forEach((segment) => {
        // if (this.experimentInfo) {
          
        //   if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE && segment.id !== this.experimentInfo.segmentExclude.id && segment.id !== this.experimentInfo.segmentInclude.id) {
        //     this.subSegmentIds.push(segment.name);
        //     this.segmentNameId.set(segment.name, segment.id);
        //   }
        // } else {
        //   if (segment.type !== SEGMENT_TYPE.GLOBAL_EXCLUDE) {
        //     this.subSegmentIds.push(segment.name);
        //     this.segmentNameId.set(segment.name, segment.id);
        //   }
        // }  
      });
    }

    this.participantsForm = this._formBuilder.group({
      inclusionCriteria: [null],
      except: [null],
      members1: this._formBuilder.array([this.addMembers1()]),
    });

    this.participantsForm2 = this._formBuilder2.group({
      inclusionCriteria: [null],
      except: [null],
      members2: this._formBuilder.array([this.addMembers2()]),
    });

    this.participantsForm.get('inclusionCriteria').setValue('Include Specific');

    if (this.experimentInfo) {
      console.log('----------------------- the experiment data in edit mode ----------------------------', this.experimentInfo);
    
      if( this.experimentInfo.filterMode === FILTER_MODE.EXCLUDE_ALL) {
        this.participantsForm.get('inclusionCriteria').setValue('Include Specific');
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
        this.participantsForm.get('inclusionCriteria').setValue('Include All Except...');
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
      // this.experimentInfo.segmentInclude.individualForSegment.forEach((id) => {
      //   this.members1.push(this.addMembers1(MemberTypes.INDIVIDUAL, id.userId));
      // });
      // this.segmentInfo.groupForSegment.forEach((group) => {
      //   this.members1.push(this.addMembers1(group.type, group.groupId));
      // });
      // this.segmentInfo.subSegments.forEach((id) => {
      //   this.members1.push(this.addMembers1(MemberTypes.SEGMENT, id.name));
      // });
      // this.segmentInfo.individualForSegment.forEach((id) => {
      //   this.members2.push(this.addMembers2(MemberTypes.INDIVIDUAL, id.userId));
      // });
      // this.segmentInfo.groupForSegment.forEach((group) => {
      //   this.members2.push(this.addMembers2(group.type, group.groupId));
      // });
      // this.segmentInfo.subSegments.forEach((id) => {
      //   this.members2.push(this.addMembers2(MemberTypes.SEGMENT, id.name));
      // });
    }

    this.updateView1();
    this.updateView2();
  }

  addMembers1(type = null, id = null) {
    return this._formBuilder.group({
      type: [type , Validators.required],
      id: [id, Validators.required],
    });
  }

  addMembers2(type = null, id = null) {
    return this._formBuilder.group({
      type: [type , Validators.required],
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
    this.updateView1();
  }

  removeMember2(groupIndex: number) {
    this.members2.removeAt(groupIndex);
    this.updateView2();
  }

  updateView1() {
    this.members1DataSource.next(this.members1.controls);
    if (this.members1Table) {
      this.members1Table.nativeElement.scroll({
        top: this.members1Table.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  updateView2() {
    this.members2DataSource.next(this.members2.controls);
    if (this.members2Table) {
      this.members2Table.nativeElement.scroll({
        top: this.members2Table.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  setMemberTypes() {
    this.subSegmentTypes = [];
    this.subSegmentTypes.push({ heading: '', value: [MemberTypes.INDIVIDUAL] });
    this.subSegmentTypes.push({ heading: '', value: [MemberTypes.SEGMENT] });
    const groups = [];
    // if (this.currentContext === 'any') {
    //   const contexts = Object.keys(this.contextMetaData['contextMetadata']) || [];
    //   contexts.forEach(context => {
    //     this.contextMetaData['contextMetadata'][context].GROUP_TYPES.forEach(group => {
    //       groups.push(group);
    //     });
    //   });
    // }
    if (this.contextMetaData['contextMetadata'] && this.contextMetaData['contextMetadata'][this.currentContext]) {
      this.contextMetaData['contextMetadata'][this.currentContext].GROUP_TYPES.forEach(type => {
        groups.push(type);
      });
    }

    this.subSegmentTypes.push({ heading: 'group', value: groups });
  }

  gettingMembersValueToSend(members: any) {
    this.userIdsToSend = [];
    this.subSegmentIdsToSend = [];
    this.groupsToSend = [];
    const memberFiltered = members.filter(member =>  member.type);
    memberFiltered.forEach(member => {
      if (member.type === MemberTypes.INDIVIDUAL) {
        this.userIdsToSend.push(member.id);
      } else if(member.type === MemberTypes.SEGMENT) {
        this.subSegmentIdsToSend.push(this.segmentNameId.get(member.id));
      } else {
        this.groupsToSend.push({ type: member.type, groupId: member.id });
      }
    });
  }

  // validateMembersCount(members: any) {
  //   const membersCountErrorMsg = this.translate.instant("segments.global-members.segments-count-members-error.text");
  //   this.membersCountError = null;
  //   if (members.length === 0) {
  //     this.membersCountError = membersCountErrorMsg;
  //   }
  // }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
        const filterMode = this.participantsForm.get('inclusionCriteria').value === 'Include Specific'
          ? FILTER_MODE.EXCLUDE_ALL
          : FILTER_MODE.INCLUDE_ALL;

        if(filterMode === FILTER_MODE.INCLUDE_ALL) {
          this.members2.clear();
        }

        const { members1 } = this.participantsForm.value;
        const { members2 } = this.participantsForm2.value;
        
        // this.validateMembersCount(members1);
        // this.validateMembersCount(members2);
        // TODO: Handle member2:
        if (this.participantsForm.valid && this.participantsForm2.valid) {
          this.gettingMembersValueToSend(members1);
          const segmentMembers1FormData = {
            userIds: this.userIdsToSend,
            groups: this.groupsToSend,
            subSegmentIds: this.subSegmentIdsToSend,
            type: SEGMENT_TYPE.PRIVATE
          }
          
          // if dropdown is includeall except then members2.clear()
          this.gettingMembersValueToSend(members2);
          const segmentMembers2FormData = {
            userIds: this.userIdsToSend,
            groups: this.groupsToSend,
            subSegmentIds: this.subSegmentIdsToSend,
            type: SEGMENT_TYPE.PRIVATE
          }
          this.emitExperimentDialogEvent.emit({
            type: this.experimentInfo ? NewExperimentDialogEvents.UPDATE_EXPERIMENT : eventType,
            formData: ( filterMode === FILTER_MODE.EXCLUDE_ALL )
              ? { segmentIncludea: segmentMembers1FormData, segmentExcludea: segmentMembers2FormData, filterMode: filterMode }
              : { segmentIncludea: segmentMembers2FormData, segmentExcludea: segmentMembers1FormData, filterMode: filterMode },
            // if dropdown is include specific
            //    formData : { segmentInclude: table1, segmentExclude: table2, filterMode: ExcludeAll  }
            // else
            //    formData : { segmentInclude: table2, segmentExclude: table1, filterMode: IncludeAll }
            // formData: { segmentInclude: segmentMembers1FormData, segmentExclude: segmentMembers2FormData, filterMode: filterMode },
            path: NewExperimentPaths.EXPERIMENT_PARTICIPANTS
          });
        }
      break;
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
    return this.participantsForm.get('inclusionCriteria').value === 'Include Specific';
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  ngOnDestroy() {
    this.contextMetaDataSub.unsubscribe();
    this.allSegmentsSub.unsubscribe();
  }
}
