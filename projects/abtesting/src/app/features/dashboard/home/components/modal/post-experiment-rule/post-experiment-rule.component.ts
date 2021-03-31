import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { POST_EXPERIMENT_RULE, ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ExperimentStatusComponent } from '../experiment-status/experiment-status.component';

@Component({
  selector: 'home-post-experiment-rule',
  templateUrl: './post-experiment-rule.component.html',
  styleUrls: ['./post-experiment-rule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostExperimentRuleComponent implements OnInit {

  experimentInfo: ExperimentVM;
  postExperimentRuleForm: FormGroup;
  postExperimentRules = [
    { value: POST_EXPERIMENT_RULE.CONTINUE },
    { value: POST_EXPERIMENT_RULE.ASSIGN }
  ];
  experimentConditions = [
    { value: 'default', id: 'default' }
  ];
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private dialogRef: MatDialogRef<ExperimentStatusComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.experimentInfo = this.data.experiment;
   }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.experimentInfo.conditions.forEach(condition => {
      this.experimentConditions.push({ value: condition.conditionCode, id: condition.id });
    });
    this.postExperimentRuleForm = this._formBuilder.group({
      postExperimentRule: [this.experimentInfo.postExperimentRule, Validators.required],
      revertTo: [{
        value: this.experimentInfo.revertTo === null ? 'default' : this.experimentInfo.revertTo,
        disabled: this.experimentInfo.postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE
      }]
    }, { validators: this.validatePostExperimentRuleForm });

    this.resetRevertToControl(this.experimentInfo.postExperimentRule);
    this.postExperimentRuleForm.get('postExperimentRule').valueChanges.subscribe(ruleValue => {
      (ruleValue === POST_EXPERIMENT_RULE.CONTINUE) ? this.postExperimentRuleForm.get('revertTo').disable() : this.postExperimentRuleForm.get('revertTo').enable();
      this.resetRevertToControl(ruleValue);
    });
  }


  // Used to reset revertTo control based on postExperimentRule value
  resetRevertToControl(controlValue: POST_EXPERIMENT_RULE) {
    if (controlValue === POST_EXPERIMENT_RULE.CONTINUE) {
      this.postExperimentRuleForm.get('revertTo').reset();
    }
  }

  validatePostExperimentRuleForm(controls: AbstractControl): { [key: string]: any } | null {
    const postExperimentRule = controls.get('postExperimentRule').value;
    const revertTo = controls.get('revertTo').value;
    if (postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && !revertTo) {
      return { conditionSelectionError: true };
    }
    return null;
  }

  changePostExperimentRule() {
    let { postExperimentRule, revertTo } = this.postExperimentRuleForm.value;
    if (postExperimentRule === POST_EXPERIMENT_RULE.CONTINUE) {
      revertTo = null;
    }
    this.experimentService.updateExperiment({ ...this.experimentInfo, postExperimentRule, revertTo: revertTo !== 'default' ? revertTo : null });
    this.onCancelClick();
  }
}
