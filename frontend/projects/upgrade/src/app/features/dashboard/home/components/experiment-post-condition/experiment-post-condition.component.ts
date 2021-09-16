import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ExperimentVM, POST_EXPERIMENT_RULE, NewExperimentDialogData, NewExperimentDialogEvents, NewExperimentPaths } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';

@Component({
  selector: 'home-experiment-post-condition',
  templateUrl: './experiment-post-condition.component.html',
  styleUrls: ['./experiment-post-condition.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentPostConditionComponent implements OnInit, OnChanges {

  @Input() experimentInfo: ExperimentVM;
  @Input() newExperimentData: Partial<ExperimentVM>;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();
  postExperimentRuleForm: FormGroup;
  postExperimentRules = [
    { value: POST_EXPERIMENT_RULE.CONTINUE },
    { value: POST_EXPERIMENT_RULE.ASSIGN }
  ];
  experimentConditions = [
    { value: 'default', id: 'default' }
  ];
  constructor(private _formBuilder: FormBuilder) { }

  ngOnChanges() {
    this.experimentConditions = [
      { value: 'default', id: 'default' }
    ];
    if (this.newExperimentData.conditions && this.newExperimentData.conditions.length) {
      this.newExperimentData.conditions.map(value => {
        const isConditionExist = this.experimentConditions.find((condition) => condition.id === value.id);
        this.experimentConditions = isConditionExist
          ? this.experimentConditions
          : [ ...this.experimentConditions, { value: value.conditionCode, id: value.id }];
      });
    }
  }

  ngOnInit() {
    this.postExperimentRuleForm = this._formBuilder.group({
      postExperimentRule: [null, Validators.required],
      revertTo: [null]
    }, { validators: ExperimentFormValidators.validatePostExperimentRuleForm });
    this.postExperimentRuleForm.get('postExperimentRule').valueChanges.subscribe(ruleValue => {
      (ruleValue === POST_EXPERIMENT_RULE.CONTINUE) ? this.postExperimentRuleForm.get('revertTo').disable() : this.postExperimentRuleForm.get('revertTo').enable();
      this.resetRevertToControl(ruleValue);
    });

    if (this.experimentInfo) {
      this.postExperimentRuleForm.patchValue({
        postExperimentRule: this.experimentInfo.postExperimentRule,
        revertTo: this.experimentInfo.revertTo === null ? 'default' : this.experimentInfo.revertTo
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
    if (eventType === NewExperimentDialogEvents.CLOSE_DIALOG) {
      this.emitExperimentDialogEvent.emit({ type: eventType });
    } else {
      let { postExperimentRule, revertTo } = this.postExperimentRuleForm.value;
      if (postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
        revertTo = null;
      }
      this.emitExperimentDialogEvent.emit({
        type: this.experimentInfo ? NewExperimentDialogEvents.UPDATE_EXPERIMENT : eventType,
        formData: { postExperimentRule, revertTo: revertTo !== 'default' ? revertTo : null },
        path: NewExperimentPaths.POST_EXPERIMENT_RULE
      });
    }
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }
}
