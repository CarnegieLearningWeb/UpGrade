import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { BehaviorSubject, Subject, from } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MOOCLET_POLICY_SCHEMA_MAP, MoocletTSConfigurablePolicyParametersDTO } from 'upgrade_types';
import { ExperimentVM } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

@Component({
  selector: 'app-mooclet-policy-editor',
  templateUrl: './mooclet-policy-editor.component.html',
  styleUrls: ['./mooclet-policy-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MoocletPolicyEditorComponent implements OnInit {
  @Input() experimentInfo: ExperimentVM;
  @Input() experimentName: string;
  @Input() currentAssignmentAlgorithm: string;
  @Input() isEditable = true;

  @ViewChild('policyEditor', { static: false }) policyEditor: JsonEditorComponent;

  options = new JsonEditorOptions();
  defaultPolicyParametersForAlgorithm: MoocletTSConfigurablePolicyParametersDTO;
  moocletPolicyParametersErrors$ = new BehaviorSubject<ValidationError[]>([]);
  editorValue$ = new Subject<any>();

  constructor(private experimentService: ExperimentService) {}

  ngOnInit() {
    this.setupEditor();
  }

  setupEditor() {
    // Only create default parameters if we don't have existing ones
    if (!this.experimentInfo?.moocletPolicyParameters) {
      this.defaultPolicyParametersForAlgorithm = new MOOCLET_POLICY_SCHEMA_MAP[this.currentAssignmentAlgorithm]();
      this.defaultPolicyParametersForAlgorithm.outcome_variable_name = this.experimentService.getOutcomeVariableName(
        this.experimentName
      );
    } else {
      // Use existing parameters from backend when editing
      this.defaultPolicyParametersForAlgorithm = this.experimentInfo.moocletPolicyParameters;
    }

    this.options.mode = this.isEditable ? 'code' : 'view';
    this.options.statusBar = false;

    // Set up value change listener for the editor value
    // This feels hacky but it ensures that editor value is always getting updated validation
    this.options.onChange = () => {
      try {
        const value = this.policyEditor.get();
        this.editorValue$.next(value);
      } catch {
        // Invalid JSON in editor (The [x] icon will be displayed in the editor)
      }
    };

    // Set up validation pipeline for feedback while typing
    // TODO: Enforce stricter validation (disallow missing props) and improve errors
    this.editorValue$
      .pipe(
        debounceTime(300),
        switchMap((jsonValue) => this.validateMoocletPolicyParameters(jsonValue))
      )
      .subscribe((errors) => {
        this.moocletPolicyParametersErrors$.next(errors);
      });
  }

  resetPolicyParameters() {
    this.defaultPolicyParametersForAlgorithm = new MOOCLET_POLICY_SCHEMA_MAP[this.currentAssignmentAlgorithm]();
    this.defaultPolicyParametersForAlgorithm.outcome_variable_name = this.experimentService.getOutcomeVariableName(
      this.experimentName
    );

    // Force editor to update with new default values
    if (this.policyEditor) {
      const jsonValue = JSON.parse(JSON.stringify(this.defaultPolicyParametersForAlgorithm));
      this.policyEditor.set(jsonValue);
    }
  }

  validateMoocletPolicyParameters(jsonValue: any) {
    const ValidatorClass = MOOCLET_POLICY_SCHEMA_MAP[this.currentAssignmentAlgorithm];
    const plainDTO = {
      assignmentAlgorithm: this.currentAssignmentAlgorithm,
      ...jsonValue,
    };
    const DTOInstance = plainToInstance(ValidatorClass, plainDTO, { enableImplicitConversion: true });
    return from(validate(DTOInstance, { whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }));
  }

  // Method to get current editor value for parent components
  getPolicyEditorValue() {
    return this.policyEditor?.get();
  }

  // Method to get current validation errors for parent components
  getPolicyEditorErrors() {
    return this.moocletPolicyParametersErrors$.value;
  }
}
