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
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM, ExperimentCondition, ExperimentPartition, IExpPointsAndIds } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';
import * as uuid from 'uuid';

@Component({
  selector: 'home-experiment-design',
  templateUrl: './experiment-design.component.html',
  styleUrls: ['./experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() animationCompleteStepperIndex: Number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('conditionTable', { static: false, read: ElementRef }) conditionTable: ElementRef;
  @ViewChild('partitionTable', { static: false, read: ElementRef }) partitionTable: ElementRef;
  @ViewChild('conditionCode', { static: false }) conditionCode: ElementRef;

  experimentDesignForm: FormGroup;
  conditionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  partitionDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allPartitions = [];
  allPartitionsSub: Subscription;

  // Condition Error
  conditionCodeError: string;

  // Partition Errors
  partitionPointErrors = [];
  partitionErrorMessages = [];
  partitionErrorMessagesSub: Subscription;

  conditionDisplayedColumns = [ 'conditionNumber', 'conditionCode', 'assignmentWeight', 'description', 'removeCondition'];
  partitionDisplayedColumns = ['partitionNumber', 'expPoint', 'expId', 'removePartition'];

  // Used for experiment point and ids auto complete dropdown
  filteredExpPoints$: Observable<string[]>[] = [];
  filteredExpIds$: Observable<string[]>[] = [];
  expPointsAndIds: IExpPointsAndIds | {} = {};
  expPointsAndIdsSub: Subscription;
  expPointAndIdErrors: string[];

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
  }

  ngOnInit() {
    this.allPartitionsSub = this.experimentService.allPartitions$.pipe(
      filter(partitions => !!partitions))
      .subscribe((partitions: any) => {
      this.allPartitions = partitions.map(partition =>
        partition.expId ? partition.expPoint + partition.expId : partition.expPoint
      );
    });
    this.experimentDesignForm = this._formBuilder.group(
      {
        conditions: this._formBuilder.array([this.addConditions(), this.addConditions()]),
        partitions: this._formBuilder.array([this.addPartitions()])
      }, { validators: ExperimentFormValidators.validateExperimentDesignForm });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of conditions and partitions
      this.condition.removeAt(0);
      this.condition.removeAt(0);
      this.partition.removeAt(0);
      this.experimentInfo.conditions.forEach(condition => {
        this.condition.push(this.addConditions(condition.conditionCode, condition.assignmentWeight, condition.description));
      });
      this.experimentInfo.partitions.forEach(partition => {
        this.partition.push(this.addPartitions(partition.expPoint, partition.expId, partition.description));
      });
    }
    this.updateView();

    // Bind predefined values of experiment points and ids from backend
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    partitionFormControl.controls.forEach((_, index) => {
      this.manageExpPointAndIdControl(index)
    });


    this.experimentDesignForm.get('partitions').valueChanges.subscribe(newValues => {
      this.validatePartitionNames(newValues);
    });

    this.expPointsAndIdsSub = this.experimentService.expPointsAndIds$
      .subscribe(expPointsAndIds => this.expPointsAndIds = expPointsAndIds);
  }

  manageExpPointAndIdControl(index: number) {
    const partitionFormControl = this.experimentDesignForm.get('partitions') as FormArray;
    this.filteredExpPoints$[index] = partitionFormControl.at(index).get('expPoint').valueChanges
      .pipe(
        startWith<string>(''),
        map(expPoint => this.filterExpPointsAndIds(expPoint, 'expPoints'))
      );
    this.filteredExpIds$[index] = partitionFormControl.at(index).get('expId').valueChanges
      .pipe(
        startWith<string>(''),
        map(expId => this.filterExpPointsAndIds(expId, 'expIds'))
      );
  }

  private filterExpPointsAndIds(value: string, key: string): string[] {
    const filterValue = value.toLowerCase();
    return this.expPointsAndIds ? (this.expPointsAndIds[key] || []).filter(option => option.toLowerCase().indexOf(filterValue) === 0) : [];
  }

  addConditions(conditionCode = null, assignmentWeight = null, description = null) {
    return this._formBuilder.group({
      conditionCode: [conditionCode, Validators.required],
      assignmentWeight: [assignmentWeight, Validators.required],
      description: [description]
    });
  }

  addPartitions(expPoint = null, expId = null, description = '') {
    return this._formBuilder.group({
      expPoint: [expPoint, Validators.required],
      expId: [expId],
      description: [description]
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
    }
  }

  removeConditionOrPartition(type: string, groupIndex: number) {
    this[type].removeAt(groupIndex);
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
          const partitionInfo = partition.expId ? partition.expPoint + partition.expId : partition.expPoint;
          const partitionPointIndex = this.allPartitions.indexOf(partitionInfo);
          if (partitionPointIndex !== -1) {
            this.allPartitions.splice(partitionPointIndex, 1);
          }
        });
    }

    partitions.forEach((partition, index) => {
      const partitionInfo = partition.expId ? partition.expPoint + partition.expId : partition.expPoint;
      if (this.allPartitions.indexOf(partitionInfo) !== -1 &&
        alreadyExistedPartitions.indexOf(partition.expId ? partition.expPoint + ' and ' + partition.expId : partition.expPoint) === -1) {
        alreadyExistedPartitions.push(partition.expId ? partition.expPoint + ' and ' + partition.expId : partition.expPoint);
      }
      if (partitions.find((value, partitionIndex) =>
        value.expPoint === partition.expPoint &&
        (value.expId || '') === (partition.expId || '') && // To match null and empty string, add '' as default value. expId as optional and hence it's value can be null.
        partitionIndex !== index &&
        duplicatePartitions.indexOf(partition.expId ? partition.expPoint + ' and ' + partition.expId : partition.expPoint) === -1)) {
        duplicatePartitions.push(partition.expId ? partition.expPoint + ' and ' + partition.expId : partition.expPoint);
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
    const conditionCodes = conditions.map(condition => condition.conditionCode);
    if (conditionCodes.length !== new Set(conditionCodes).size) {
      this.conditionCodeError = 'Condition should be unique'
    } else {
      this.conditionCodeError = null;
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
    const expPoints = partitions.map(partition => partition.expPoint);
    for (let expPointIndex = 0; expPointIndex < expPoints.length; expPointIndex++) {
      if ((this.expPointsAndIds as IExpPointsAndIds).expPoints.indexOf(expPoints[expPointIndex]) === -1) {
        // Add partition point selection error
        this.expPointAndIdErrors.push(this.partitionErrorMessages[4]);
        break;
      }
    }
  }

  validateExpIds(partitions: ExperimentPartition[]) {
    const expIds = partitions.map(partition => partition.expId).filter(expId => expId);
    for (let expIdIndex = 0; expIdIndex < expIds.length; expIdIndex++) {
      if ((this.expPointsAndIds as IExpPointsAndIds).expIds.indexOf(expIds[expIdIndex]) === -1) {
        // Add partition id selection error
        this.expPointAndIdErrors.push(this.partitionErrorMessages[5]);
        break;
      }
    }
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        this.emitExperimentDialogEvent.emit({ type: eventType });
        break;
      case NewExperimentDialogEvents.SEND_FORM_DATA:
      case NewExperimentDialogEvents.SAVE_DATA:
        this.validateConditionCodes(this.experimentDesignForm.get('conditions').value);
        this.validatePartitions();
        if (!this.partitionPointErrors.length && !this.expPointAndIdErrors.length && this.experimentDesignForm.valid && !this.conditionCodeError) {
          const experimentDesignFormData = this.experimentDesignForm.value;

          experimentDesignFormData.conditions = experimentDesignFormData.conditions.map(
            (condition, index) => {
              return this.experimentInfo
                ? ({ ...this.experimentInfo.conditions[index], ...condition })
                : ({ id: uuid.v4(), ...condition, name: ''});
            }
          );
          experimentDesignFormData.partitions = experimentDesignFormData.partitions.map(
            (partition, index) => {
              return this.experimentInfo
                ? ({ ...this.experimentInfo.partitions[index], ...partition })
                : (partition.expId ? partition : this.removePartitionName(partition));
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

  removePartitionName(partition) {
    delete partition.expId;
    return partition;
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

  get isAssignmentWeightControlDirty() {
    if (this.experimentDesignForm) {
      return (this.experimentDesignForm.controls.conditions as any).controls.some(
        control => control.controls.assignmentWeight.dirty
      );
    }
    return false;
  }


  ngOnDestroy() {
    this.allPartitionsSub.unsubscribe();
    this.partitionErrorMessagesSub.unsubscribe();
    this.expPointsAndIdsSub.unsubscribe();
  }
}
