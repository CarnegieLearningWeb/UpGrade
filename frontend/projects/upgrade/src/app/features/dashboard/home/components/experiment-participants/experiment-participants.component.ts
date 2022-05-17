import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM, ExperimentCondition, ExperimentPartition, IContextMetaData } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentParticipantsComponent implements OnInit {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  @ViewChild('members1Table', { static: false, read: ElementRef }) members1Table: ElementRef;

  participantsForm: FormGroup;
  members1DataSource = new BehaviorSubject<AbstractControl[]>([]);
  
  inclusionCriteria = [{ value: 'includeAll'}, { value: 'excludeAll'}];
  membersDisplayedColumns = [ 'memberNumber', 'type', 'id', 'removeMember'];
  
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService
  ) { }

  ngOnInit() {
    this.participantsForm = this._formBuilder.group({
      inclusionCriteria: [null],
      except: [null],
      members1: this._formBuilder.array([this.addMembers1()]),
    });
  }

  addMembers1(type = null, id = null) {
    return this._formBuilder.group({
      type: [type , Validators.required],
      id: [id, Validators.required],
    });
  }

  addMember1() {
    this.members1.push(this.addMembers1());
    this.updateView1();
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

  get members1(): FormArray {
    return this.participantsForm.get('members1') as FormArray;
  }

  get inclusionCriterisAsIncludeSpecific() {
    return this.participantsForm.get('inclusionCriteria').value === 'includeAll';
  }
}
