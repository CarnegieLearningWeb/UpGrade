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
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM, ExperimentCondition, ExperimentPartition, IContextMetaData, EXPERIMENT_STATE } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('conditionTable', { read: ElementRef }) conditionTable: ElementRef;
  @ViewChild('partitionTable', { read: ElementRef }) partitionTable: ElementRef;
  @ViewChild('conditionCode') conditionCode: ElementRef;

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  partitionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allPartitions = [];
  allPartitionsSub: Subscription;

  // Condition Errors
  conditionCountError: string;

  // Partition Errors
  partitionPointErrors = [];
  partitionErrorMessages = [];
  partitionErrorMessagesSub: Subscription;
  partitionCountError: string;

  previousAssignmentWeightValues =  [];

  conditionDisplayedColumns = ['conditionCode', 'assignmentWeight', 'description', 'removeCondition'];
  partitionDisplayedColumns = ['site', 'target', 'removePartition'];

  // Used for condition code, experiment point and ids auto complete dropdown
  filteredConditionCodes$: Observable<string[]>[] = [];
  filteredExpPoints$: Observable<string[]>[] = [];
  filteredExpIds$: Observable<string[]>[] = [];
  // filteredRequiredIds$: Observable<string[]>[] = [];
  contextMetaData: IContextMetaData | {} = {};
  contextMetaDataSub: Subscription;
  expPointAndIdErrors: string[] = [];
  conditionCodeErrors: string[] = [];
  equalWeightFlag: boolean = true;
  
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService
  ) {
    this.partitionErrorMessagesSub = this.translate.get([
      'home.new-experiment.design.assignment-partition-error-1.text',
      'home.new-experiment.design.assignment-partition-error-2.text',
      'home.new-experiment.design.assignment-partition-error-3.text',
      'home.new-experiment.design.assignment-partition-error-4.text',
      'home.new-experiment.design.partition-point-selection-error.text',
      'home.new-experiment.design.partition-id-selection-error.text'
    ]).subscribe(translatedMessage => {
      this.partitionErrorMessages = [
        translatedMessage['home.new-experiment.design.assignment-partition-error-1.text'],
        translatedMessage['home.new-experiment.design.assignment-partition-error-2.text'],
        translatedMessage['home.new-experiment.design.assignment-partition-error-3.text'],
        translatedMessage['home.new-experiment.design.assignment-partition-error-4.text'],
        translatedMessage['home.new-experiment.design.partition-point-selection-error.text'],
        translatedMessage['home.new-experiment.design.partition-id-selection-error.text'],
      ];
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.animationCompleteStepperIndex && changes.animationCompleteStepperIndex.currentValue === 1 && this.conditionCode) {
      this.conditionCode.nativeElement.focus();
    }

    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.partition.clear();
      this.condition.clear();
      this.partition.push(this.addPartitions());
      this.condition.push(this.addConditions());
      this.partitionDataSource.next(this.partition.controls);
      this.conditionDataSource.next(this.condition.controls);
    }

    this.applyEqualWeight();
  }

  ngOnInit() {
    this.contextMetaDataSub = this.experimentService.contextMetaData$.subscribe(contextMetaData => {
      this.contextMetaData = contextMetaData;
    });

    this.allPartitionsSub = this.experimentService.allPartitions$.pipe(
      filter(partitions => !!partitions))
      .subscribe((partitions: any) => {
      this.allPartitions = partitions.map(partition =>
        partition.target ? partition.site + partition.target : partition.site
      );
    });
    this.experimentDesignForm = this._formBuilder.group(
      {
        conditions: this._formBuilder.array([this.addConditions()]),
        partitions: this._formBuilder.array([this.addPartitions()])
      }, { validators: ExperimentFormValidators.validateExperimentDesignForm });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      this.equalWeightFlag = false;
      // Remove previously added group of conditions and partitions
      this.condition.removeAt(0);
      this.partition.removeAt(0);
      this.experimentInfo.conditions.forEach(condition => {
        this.condition.push(this.addConditions(condition.conditionCode, condition.assignmentWeight, condition.description, condition.order));
      });
      this.experimentInfo.partitions.forEach(partition => {
        this.partition.push(this.addPartitions(partition.site, partition.target, partition.description, partition.order));
      });

      // disable control on edit:
      if (this.experimentInfo.state == this.ExperimentState.ENROLLING || this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE) {
        this.experimentDesignForm.disable();
      }
    }
    this.updateView();

    // Bind predefined values of experiment conditionCode from backend
    const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
    conditionFormControl.controls.forEach((_, index) => {
      this.manageConditionCodeControl(index)
    });

    // Bind predefined values of experiment points and ids from backend
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    partitionFormControl.controls.forEach((_, index) => {
      this.manageExpPointAndIdControl(index)
    });


    this.experimentDesignForm.get('partitions').valueChanges.subscribe(newValues => {
      this.validatePartitionNames(newValues);
    });
  }

  manageConditionCodeControl(index: number) {
    const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
    this.filteredConditionCodes$[index] = conditionFormControl.at(index).get('conditionCode').valueChanges
      .pipe(
        startWith<string>(''),
        map(conditionCode => this.filterConditionCodes(conditionCode))
      );
    this.applyEqualWeight(); 
  }

  manageExpPointAndIdControl(index: number) {
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    this.filteredExpPoints$[index] = partitionFormControl.at(index).get('site').valueChanges
      .pipe(
        startWith<string>(''),
        map(site => this.filterExpPointsAndIds(site, 'expPoints'))
      );
    this.filteredExpIds$[index] = partitionFormControl.at(index).get('target').valueChanges
      .pipe(
        startWith<string>(''),
        map(target => this.filterExpPointsAndIds(target, 'expIds'))
      );

    // this.filteredRequiredIds$[index] = partitionFormControl.at(index).get('requiredId').valueChanges
    //   .pipe(
    //     startWith<string>(''),
    //     map(expId => this.filterExpPointsAndIds(expId, 'requiredIds'))
    //   );
  }

  private filterConditionCodes(value: string): string[] {
    const filterValue = value ?  value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (this.currentContext) {
      const currentContextConditionCode = (this.contextMetaData['contextMetadata'][this.currentContext].CONDITIONS || []);
      return currentContextConditionCode.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
    }
    return [];
  }

  private filterExpPointsAndIds(value: string, key: string): string[] {
    const filterValue = value ?  value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (key === 'expPoints' && this.currentContext) {
      const currentContextExpPoints = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_POINTS || []);
      return currentContextExpPoints.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
    } else if (key === 'expIds' && this.currentContext) {
      const currentContextExpIds = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_IDS || []);
      return currentContextExpIds.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
    }
    return [];
  }

  addConditions(conditionCode = null, assignmentWeight = null, description = null, order = null) {
    return this._formBuilder.group({
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description],
      order: [order]
    });
  }

  addPartitions(site = null, target = null, description = '', order = null) {
    return this._formBuilder.group({
      site: [site, Validators.required],
      target: [target],
      description: [description],
      order: [order]
    });
  }

  addConditionOrPartition(type: string) {
    const isPartition = type === 'partition';
    const form = isPartition ? this.addPartitions() : this.addConditions();
    this[type].push(form);
    const scrollTableType = isPartition ? 'partitionTable' : 'conditionTable';
    this.updateView(scrollTableType);
    if (isPartition) {
      const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
      this.manageExpPointAndIdControl(partitionFormControl.controls.length - 1);
    } else {
      const conditionFormControl = this.experimentDesignForm.get('conditions') as FormArray;
      this.manageConditionCodeControl(conditionFormControl.controls.length - 1);
    }
  }

  removeConditionOrPartition(type: string, groupIndex: number) {
    this[type].removeAt(groupIndex);
    if (type === 'condition' && this.experimentInfo) {
      const deletedCondition = this.experimentInfo.conditions.find(condition => condition.order === groupIndex + 1);
      if (deletedCondition) {
        delete this.experimentInfo.conditions[groupIndex];
        if (this.experimentInfo.revertTo === deletedCondition.id) {
          this.experimentInfo.revertTo = null;
        }
      }
    }
    if (type === 'condition'){
      this.previousAssignmentWeightValues.splice(groupIndex, 1);  
      this.applyEqualWeight();
    }
    this.updateView();
  }

  updateView(type?: string) {
    this.conditionDataSource.next(this.condition.controls);
    this.partitionDataSource.next(this.partition.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  validatePartitionNames(partitions: any) {
    this.partitionPointErrors = [];
    // Used to differentiate errors
    const alreadyExistedPartitions = [];
    const duplicatePartitions = [];

    // Used for updating existing experiment
    if (this.experimentInfo) {
        this.experimentInfo.partitions.forEach(partition => {
          const partitionInfo = partition.target ? partition.site + partition.target : partition.site;
          const partitionPointIndex = this.allPartitions.indexOf(partitionInfo);
          if (partitionPointIndex !== -1) {
            this.allPartitions.splice(partitionPointIndex, 1);
          }
        });
    }

    partitions.forEach((partition, index) => {
      const partitionInfo = partition.target ? partition.site + partition.target : partition.site;
      if (this.allPartitions.indexOf(partitionInfo) !== -1 &&
        alreadyExistedPartitions.indexOf(partition.target ? partition.site + ' and ' + partition.target : partition.site) === -1) {
        alreadyExistedPartitions.push(partition.target ? partition.site + ' and ' + partition.target : partition.site);
      }
      if (partitions.find((value, partitionIndex) =>
        value.site === partition.site &&
        (value.target || '') === (partition.target || '') && // To match null and empty string, add '' as default value. target as optional and hence it's value can be null.
        partitionIndex !== index &&
        duplicatePartitions.indexOf(partition.target ? partition.site + ' and ' + partition.target : partition.site) === -1)) {
        duplicatePartitions.push(partition.target ? partition.site + ' and ' + partition.target : partition.site);
      }
    });

    // Partition Points error messages
    if (alreadyExistedPartitions.length === 1) {
      this.partitionPointErrors.push(alreadyExistedPartitions[0] + this.partitionErrorMessages[0]);
    } else if (alreadyExistedPartitions.length > 1) {
      this.partitionPointErrors.push(alreadyExistedPartitions.join(', ') + this.partitionErrorMessages[1]);
    }
    if (duplicatePartitions.length === 1) {
      this.partitionPointErrors.push(duplicatePartitions[0] + this.partitionErrorMessages[2]);
    } else if (duplicatePartitions.length > 1) {
      this.partitionPointErrors.push(duplicatePartitions.join(', ') + this.partitionErrorMessages[3]);
    }
  }

  validateConditionCodes(conditions: ExperimentCondition[]) {

    let conditionUniqueErrorText = this.translate.instant('home.new-experiment.design.condition-unique-validation.text');
    const conditionCodes = conditions.map(condition => condition.conditionCode);
    const hasUniqueConditionError = conditionCodes.length !== new Set(conditionCodes).size;
    if (hasUniqueConditionError && this.conditionCodeErrors.indexOf(conditionUniqueErrorText) === -1) {
      this.conditionCodeErrors.push(conditionUniqueErrorText);
    } else if (!hasUniqueConditionError) {
      const index = this.conditionCodeErrors.indexOf(conditionUniqueErrorText, 0);
      if (index > -1) {
        this.conditionCodeErrors.splice(index, 1);
      }
    }
  }

  validateHasConditionCodeDefault(conditions: ExperimentCondition[]) {

    let defaultKeyword = this.translate.instant('home.new-experiment.design.condition.invalid.text');
    let defaultConditionCodeErrorText = this.translate.instant('home.new-experiment.design.condition-name-validation.text');
    if (conditions.length) {
      const hasDefaultConditionCode = conditions.filter(
        condition => condition.conditionCode.toUpperCase() === defaultKeyword
      );
      if (hasDefaultConditionCode.length && this.conditionCodeErrors.indexOf(defaultConditionCodeErrorText) === -1) {
        this.conditionCodeErrors.push(defaultConditionCodeErrorText);
      } else if (!hasDefaultConditionCode.length) {
        const index = this.conditionCodeErrors.indexOf(defaultConditionCodeErrorText, 0);
        if (index > -1) {
          this.conditionCodeErrors.splice(index, 1);
        }
      }
    }
  }

  validateHasAssignmentWeightsNegative(conditions: ExperimentCondition[]) {
    
    let negativeAssignmentWeightErrorText = this.translate.instant('home.new-experiment.design.assignment-weight-negative.text');
    if (conditions.length) {
      const hasNegativeAssignmentWeights = conditions.filter(
        condition => condition.assignmentWeight < 0
      );
      if (hasNegativeAssignmentWeights.length && this.conditionCodeErrors.indexOf(negativeAssignmentWeightErrorText) === -1) {
        this.conditionCodeErrors.push(negativeAssignmentWeightErrorText);
      } else if (!hasNegativeAssignmentWeights.length) {
        const index = this.conditionCodeErrors.indexOf(negativeAssignmentWeightErrorText, 0);
        if (index > -1) {
          this.conditionCodeErrors.splice(index, 1);
        }
      }
    }
  }

  validateConditionCount(conditions: ExperimentCondition[]) {
    const conditionCountErrorMsg = this.translate.instant('home.new-experiment.design.condition-count-new-exp-error.text');
    if (conditions.length >= 0) {
      if(conditions.length == 0) {
        this.conditionCountError = conditionCountErrorMsg;
      } else if (conditions.length >= 1) {
        const conditionWeight = conditions.map(condition => condition.assignmentWeight);
        !conditionWeight[0] ? this.conditionCountError = conditionCountErrorMsg : this.conditionCountError = null;
      }
    }
  }

  validatePartitionCount(partitions: ExperimentPartition[]) {
    const partitionExpPoints = partitions.map(partition => partition.site);
    const partitionCountErrorMsg = this.translate.instant('home.new-experiment.design.partition-count-new-exp-error.text');
    if (partitionExpPoints.length <= 1) {
      if(partitionExpPoints.length == 0) {
        this.partitionCountError = partitionCountErrorMsg;
      } else {
        !partitionExpPoints[0] ? this.partitionCountError = partitionCountErrorMsg : this.partitionCountError = null;
      }
    }
  }
  
  validatePartitions() {
    // Reset expPointAndIdErrors errors to re-validate data
    this.expPointAndIdErrors = [];
    const partitions: ExperimentPartition[] = this.experimentDesignForm.get('partitions').value;
    this.validateExpPoints(partitions);
    this.validateExpIds(partitions);
  }

  validateExpPoints(partitions: ExperimentPartition[]) {
    const sites = partitions.map(partition => partition.site);
    const currentContextExpPoints = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_POINTS);

    for (let siteIndex = 0; siteIndex < sites.length; siteIndex++) {
      if (currentContextExpPoints.indexOf(sites[siteIndex]) === -1) {
        // Add partition point selection error
        this.expPointAndIdErrors.push(this.partitionErrorMessages[4]);
        break;
      }
    }
  }
  
  validateExpIds(partitions: ExperimentPartition[]) {
    const targets = partitions.map(partition => partition.target).filter(target => target);
    const currentContextExpIds = (this.contextMetaData['contextMetadata'][this.currentContext].EXP_IDS);

    for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      if (currentContextExpIds.indexOf(targets[targetIndex]) === -1) {
        // Add partition id selection error
        this.expPointAndIdErrors.push(this.partitionErrorMessages[5]);
        break;
      }
    }
  }

  removePartitionName(partition) {
    delete partition.target;
    return partition;
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
      case NewExperimentDialogEvents.SAVE_DATA:
        if (this.experimentInfo && (this.experimentInfo.state == this.ExperimentState.ENROLLING || this.experimentInfo.state == this.ExperimentState.ENROLLMENT_COMPLETE)) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: this.experimentInfo,
            path: NewExperimentPaths.EXPERIMENT_DESIGN
          });
          break;
        }
        this.validateConditionCodes(this.experimentDesignForm.get('conditions').value);
        this.validateConditionCount((this.experimentDesignForm.get('conditions') as FormArray).getRawValue());
        this.validatePartitionCount(this.experimentDesignForm.get('partitions').value);
        this.validateHasConditionCodeDefault(this.experimentDesignForm.get('conditions').value);
        this.validateHasAssignmentWeightsNegative((this.experimentDesignForm.get('conditions') as FormArray).getRawValue());
        
        // TODO: Uncomment to validate partitions with predefined site and target
        // this.validatePartitions();

        // enabling Assignment weight for form to validate
        if (!this.partitionPointErrors.length && !this.expPointAndIdErrors.length && !this.conditionCodeErrors.length && !this.partitionCountError) {
          (this.experimentDesignForm.get('conditions') as FormArray).controls.forEach(control => {
            control.get('assignmentWeight').enable();
          });
        }
        if (!this.partitionPointErrors.length && !this.expPointAndIdErrors.length && this.experimentDesignForm.valid && !this.conditionCodeErrors.length) {
          const experimentDesignFormData = this.experimentDesignForm.value;
          let order = 1;
          experimentDesignFormData.conditions = experimentDesignFormData.conditions.map(
            (condition, index) => {
              if (isNaN(condition.assignmentWeight) && condition.assignmentWeight.endsWith("%")) {
                condition.assignmentWeight = Number(condition.assignmentWeight.slice(0,-1));
              }
              return this.experimentInfo
                ? ({ ...this.experimentInfo.conditions[index], ...condition, order: order++ })
                : ({ id: uuidv4(), ...condition, name: '', order: order++ });
            }
          );
          order = 1;
          experimentDesignFormData.partitions = experimentDesignFormData.partitions.map(
            (partition, index) => {
              return this.experimentInfo
                ? ({ ...this.experimentInfo.partitions[index], ...partition, order: order++ })
                : (partition.target 
                  ? ({...partition, order: order++ }) 
                  : ({...this.removePartitionName(partition), order: order++ })
                );
            }
          );
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: experimentDesignFormData,
            path: NewExperimentPaths.EXPERIMENT_DESIGN
          });
        }
        break;
    }
  }
  
  applyEqualWeight() {
    if (this.experimentDesignForm){
      const conditions = this.experimentDesignForm.get('conditions') as FormArray;
      if (this.equalWeightFlag) {
        const len = conditions.controls.length;
        this.previousAssignmentWeightValues =  [];
        conditions.controls.forEach( control => {
          control.get('assignmentWeight').setValue((100.0/len).toFixed(1).toString() + '%');
          this.previousAssignmentWeightValues.push(control.get('assignmentWeight').value);
          control.get('assignmentWeight').disable();
        });
      } else {
        conditions.controls.forEach( (control, index) => {
        control.get('assignmentWeight').setValue(control.value.assignmentWeight 
          ? control.value.assignmentWeight
          : this.previousAssignmentWeightValues[index]
        );
        control.get('assignmentWeight').enable();
        });
      }
    }
  }

  changeEqualWeightFlag(event) {
    event.checked ? this.equalWeightFlag = true : this.equalWeightFlag = false
    this.applyEqualWeight();
  }

  get condition(): FormArray {
    return this.experimentDesignForm.get('conditions') as FormArray;
  }

  get partition(): FormArray {
    return this.experimentDesignForm.get('partitions') as FormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  ngOnDestroy() {
    this.allPartitionsSub.unsubscribe();
    this.partitionErrorMessagesSub.unsubscribe();
    this.contextMetaDataSub.unsubscribe();
  }
}
