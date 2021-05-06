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
import { BehaviorSubject, Subscription } from 'rxjs';
import { NewExperimentDialogEvents, NewExperimentDialogData, NewExperimentPaths, ExperimentVM, ExperimentCondition, ExperimentPartition } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentFormValidators } from '../../validators/experiment-form.validators';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
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
  conditionCountError: string;

  // Partition Errors
  partitionPointErrors = [];
  partitionErrorMessages = [];
  partitionErrorMessagesSub: Subscription;
  partitionCountError: string;

  conditionDisplayedColumns = [ 'conditionNumber', 'conditionCode', 'assignmentWeight', 'description', 'removeCondition'];
  partitionDisplayedColumns = ['partitionNumber', 'expPoint', 'expId', 'removePartition'];
  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService
  ) {
    this.partitionErrorMessagesSub = this.translate.get([
      'home.new-experiment.design.assignment-partition-error-1.text',
      'home.new-experiment.design.assignment-partition-error-2.text',
      'home.new-experiment.design.assignment-partition-error-3.text',
      'home.new-experiment.design.assignment-partition-error-4.text'
    ]).subscribe(arrayValues => {
      this.partitionErrorMessages = [
        arrayValues['home.new-experiment.design.assignment-partition-error-1.text'],
        arrayValues['home.new-experiment.design.assignment-partition-error-2.text'],
        arrayValues['home.new-experiment.design.assignment-partition-error-3.text'],
        arrayValues['home.new-experiment.design.assignment-partition-error-4.text'],
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
        conditions: this._formBuilder.array([this.addConditions()]),
        partitions: this._formBuilder.array([this.addPartitions()])
      }, { validators: ExperimentFormValidators.validateExperimentDesignForm });

    // populate values in form to update experiment if experiment data is available
    if (this.experimentInfo) {
      // Remove previously added group of conditions and partitions
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

    this.experimentDesignForm.get('partitions').valueChanges.subscribe(newValues => {
      this.validatePartitionNames(newValues);
    });
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
    const form = type === 'condition' ? this.addConditions() : this.addPartitions();
    this[type].push(form);
    const scrollTableType = type === 'condition' ? 'conditionTable' : 'partitionTable';
    this.updateView(scrollTableType);
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
        value.expId === partition.expId &&
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
      this.conditionCodeError = this.translate.instant('home.new-experiment.design.condition-unique-validation.text')
    } else {
      this.conditionCodeError = null;
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
    const partitionExpPoints = partitions.map(partition => partition.expPoint);
    const partitionCountErrorMsg = this.translate.instant('home.new-experiment.design.partition-count-new-exp-error.text');
    if (partitionExpPoints.length <= 1) {
      if(partitionExpPoints.length == 0) {
        this.partitionCountError = partitionCountErrorMsg;
      } else {
        !partitionExpPoints[0] ? this.partitionCountError = partitionCountErrorMsg : this.partitionCountError = null;
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
        this.validateConditionCount(this.experimentDesignForm.get('conditions').value);
        this.validatePartitionCount(this.experimentDesignForm.get('partitions').value);
        if (!this.partitionPointErrors.length && this.experimentDesignForm.valid && !this.conditionCodeError && !this.conditionCountError && !this.partitionCountError) {
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

  ngOnDestroy() {
    this.allPartitionsSub.unsubscribe();
    this.partitionErrorMessagesSub.unsubscribe();
  }
}
