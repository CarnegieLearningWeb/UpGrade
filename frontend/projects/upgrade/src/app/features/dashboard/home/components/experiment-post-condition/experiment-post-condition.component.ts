import {
  Component,
  Inject,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  ExperimentVM,
  POST_EXPERIMENT_RULE,
  NewExperimentDialogData,
  NewExperimentDialogEvents,
  NewExperimentPaths,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { Store } from '@ngrx/store';
import { formDataChanged,formDataReset } from '../../data-change-flag/data-change-flag.actions';

@Component({
  selector: 'home-experiment-post-condition',
  templateUrl: './experiment-post-condition.component.html',
  styleUrls: ['./experiment-post-condition.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentPostConditionComponent implements OnInit, OnChanges {
  @Input() experimentInfo: ExperimentVM;
  @Input() newExperimentData: Partial<ExperimentVM>;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  postExperimentRuleForm: FormGroup;
  postExperimentRules = [{ value: POST_EXPERIMENT_RULE.CONTINUE }, { value: POST_EXPERIMENT_RULE.ASSIGN }];
  experimentConditions = [{ value: 'default', id: 'default' }];
  experimentSub: Subscription;

  // Used for speedbump when clicked on close
  dataChanged$: Observable<boolean>;
  flag: boolean = false;
  
  constructor(
    private experimentService: ExperimentService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _formBuilder: FormBuilder,
    private store: Store<{ dataChanged: boolean }>
    ) {
      this.dataChanged$ = store.select('dataChanged');
      this.dataChanged$.subscribe((isdataChanged)=>this.flag=isdataChanged);
    }

  ngOnChanges() {
    this.experimentConditions = [{ value: 'default', id: 'default' }];
    if (this.experimentInfo) {
      this.experimentSub = this.experimentService
        .selectExperimentById(this.experimentInfo.id)
        .subscribe((experimentData) => {
          this.newExperimentData = experimentData;
          this.experimentInfo = experimentData;
        });
    } else if (this.data && this.data.experiment) {
      this.experimentInfo = this.data.experiment;
      this.newExperimentData = this.data.experiment;
    }

    if (this.newExperimentData && this.newExperimentData.conditions && this.newExperimentData.conditions.length) {
      this.newExperimentData.conditions.map((value) => {
        const isConditionExist = this.experimentConditions.find((condition) => condition.id === value.id);
        this.experimentConditions = isConditionExist
          ? this.experimentConditions
          : [...this.experimentConditions, { value: value.conditionCode, id: value.id }];
      });
    }
  }

  ngOnInit() {
    this.postExperimentRuleForm = this._formBuilder.group(
      {
        postExperimentRule: [null, Validators.required],
        revertTo: [null],
      },
      { validators: ExperimentFormValidators.validatePostExperimentRuleForm }
    );
    this.postExperimentRuleForm.get('postExperimentRule').valueChanges.subscribe((ruleValue) => {
      ruleValue === POST_EXPERIMENT_RULE.CONTINUE
        ? this.postExperimentRuleForm.get('revertTo').disable()
        : this.postExperimentRuleForm.get('revertTo').enable();
      this.resetRevertToControl(ruleValue);
    });

    if (this.experimentInfo) {
      this.postExperimentRuleForm.patchValue({
        postExperimentRule: this.experimentInfo.postExperimentRule,
        revertTo: this.experimentInfo.revertTo === null ? 'default' : this.experimentInfo.revertTo,
      });
    }
  }

  // Used to reset revertTo control based on postExperimentRule value
  resetRevertToControl(controlValue: POST_EXPERIMENT_RULE) {
    if (controlValue === POST_EXPERIMENT_RULE.CONTINUE) {
      this.postExperimentRuleForm.get('revertTo').reset();
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (this.flag || this.postExperimentRuleForm.dirty) {
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
        this.data_changed();
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        this.saveData(eventType);
        this.flag_reset();
        this.postExperimentRuleForm.markAsPristine();
        break;
    }
  }

  saveData(eventType) {
    const { postExperimentRule } = this.postExperimentRuleForm.value;
    let { revertTo } = this.postExperimentRuleForm.value;
    if (postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      revertTo = null;
    }
    this.emitExperimentDialogEvent.emit({
      type: this.experimentInfo ? NewExperimentDialogEvents.UPDATE_EXPERIMENT : eventType,
      formData: {
        postExperimentRule,
        conditions: this.newExperimentData.conditions,
        revertTo: revertTo !== 'default' ? revertTo : null,
      },
      path: NewExperimentPaths.POST_EXPERIMENT_RULE,
    });
  }

  data_changed() {
    if(this.postExperimentRuleForm.dirty){
      this.store.dispatch(formDataChanged());
    }
  }
 
  flag_reset() {
    this.store.dispatch(formDataReset());
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
