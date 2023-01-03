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
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  NewExperimentDialogEvents,
  NewExperimentDialogData,
  NewExperimentPaths,
  ExperimentVM,
  ExperimentCondition,
  ExperimentPartition,
  IContextMetaData,
  EXPERIMENT_STATE,
  ExperimentFactor,
  ExperimentLevel,
  ExperimentConditionAlias,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { TranslateService } from '@ngx-translate/core';
import { v4 as uuidv4 } from 'uuid';
import { filter, map, startWith } from 'rxjs/operators';
import { DialogService } from '../../../../../shared/services/dialog.service';
import { ExperimentDesignStepperService } from '../../../../../core/experiment-design-stepper/experiment-design-stepper.service';
import { ExperimentAliasTableRow } from '../../../../../core/experiment-design-stepper/store/experiment-design-stepper.model';

@Component({
  selector: 'home-factorial-experiment-design',
  templateUrl: './factorial-experiment-design.component.html',
  styleUrls: ['./factorial-experiment-design.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactorialExperimentDesignComponent implements OnInit, OnChanges, OnDestroy {
  @Input() experimentInfo: ExperimentVM;
  @Input() currentContext: string;
  @Input() isContextChanged: boolean;
  @Input() animationCompleteStepperIndex: number;
  @Output() emitExperimentDialogEvent = new EventEmitter<NewExperimentDialogData>();

  @ViewChild('stepContainer', { read: ElementRef }) stepContainer: ElementRef;
  @ViewChild('factorTable', { read: ElementRef }) factorTable: ElementRef;
  @ViewChild('levelTable', { read: ElementRef }) levelTable: ElementRef;

  subscriptionHandler: Subscription;

  factorialExperimentDesignForm: FormGroup;
  factorDataSource = new BehaviorSubject<AbstractControl[]>([]);
  allFactors = [];

  // Factor Errors
  factorPointErrors = [];
  factorErrorMessages = [];
  factorCountError: string = null;

  // Level Errors
  levelPointErrors = [];
  levelCountError: string = null;

  expandedId: number = null;

  factorDisplayedColumns = ['expandIcon', 'factor', 'site', 'target', 'removeFactor'];
  levelDisplayedColumns = ['level', 'alias', 'removeLevel'];

  // Used for condition code, experiment point and ids auto complete dropdownfilteredExpFactors$: Observable<string[]>[] = [];
  filteredExpFactors$: Observable<string[]>[] = [];
  filteredExpPoints$: Observable<string[]>[] = [];
  filteredExpIds$: Observable<string[]>[] = [];
  contextMetaData: IContextMetaData = {
    contextMetadata: {},
  };
  expPointAndIdErrors: string[] = [];
  isExperimentEditable = true;
  isFormLockedForEdit$ = this.experimentDesignStepperService.isFormLockedForEdit$;

  // Alias Table details
  designData$ = new BehaviorSubject<[ExperimentPartition[], ExperimentCondition[]]>([[], []]);
  aliasTableData: ExperimentAliasTableRow[] = [];
  isAliasTableEditMode$: Observable<boolean>;

  constructor(
    private _formBuilder: FormBuilder,
    private experimentService: ExperimentService,
    private translate: TranslateService,
    private dialogService: DialogService,
    public experimentDesignStepperService: ExperimentDesignStepperService
  ) {
    this.subscriptionHandler = this.translate
      .get([
        'home.new-experiment.design.assignment-factor-error-1.text',
        'home.new-experiment.design.assignment-factor-error-2.text',
        'home.new-experiment.design.assignment-level-error-1.text',
        'home.new-experiment.design.assignment-level-error-2.text',
        'home.new-experiment.design.partition-point-selection-error.text',
        'home.new-experiment.design.partition-id-selection-error.text',
      ])
      .subscribe((translatedMessage) => {
        this.factorErrorMessages = [
          translatedMessage['home.new-experiment.design.assignment-factor-error-1.text'],
          translatedMessage['home.new-experiment.design.assignment-factor-error-2.text'],
          translatedMessage['home.new-experiment.design.assignment-level-error-1.text'],
          translatedMessage['home.new-experiment.design.assignment-level-error-2.text'],
          translatedMessage['home.new-experiment.design.partition-point-selection-error.text'],
          translatedMessage['home.new-experiment.design.partition-id-selection-error.text'],
        ];
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isContextChanged) {
      this.isContextChanged = false;
      this.factor?.clear();
      this.level?.clear();
      this.factorDataSource.next(this.factor?.controls);
    }
  }

  ngOnInit() {
    this.subscriptionHandler = this.experimentService.contextMetaData$.subscribe((contextMetaData) => {
      this.contextMetaData = contextMetaData;
    });
    // this.allPartitionsSub = this.experimentService.allPartitions$
    //   .pipe(filter((partitions) => !!partitions))
    //   .subscribe((partitions: any) => {
    //     this.allPartitions = partitions.map((partition) =>
    //       partition.target ? partition.site + partition.target : partition.site
    //     );
    //   });

    // this.subscriptionHandler = this.experimentService.allPartitions$
    //   .pipe(filter((partitions) => !!partitions))
    //   .subscribe((partitions: any) => {
    //     this.allFactors = partitions.map((partition) =>
    //       partition.factors ? (partition.factors.map((factor) => partition.site + partition.target + factor.name ))
    //         : (partition.target ? partition.site + partition.target : partition.site)
    //     );
    //   });

    this.factorialExperimentDesignForm = this._formBuilder.group({
      factors: this._formBuilder.array([this.addFactors()]),
    });
    // this.createDesignDataSubject();
    // this.isAliasTableEditMode$ = this.experimentService.isAliasTableEditMode$;

    // populate values in form to update experiment if experiment data is available
    let factorIndex = 0;
    if (this.experimentInfo) {
      this.factor.removeAt(0);
      this.experimentInfo.partitions.forEach((partition) => {
        partition.factors.forEach((factor) => {
          this.factor.push(this.addFactors(factor.name, partition.site, partition.target, factor.order));
          this.getLevels(factorIndex).removeAt(0);
          factor.levels.forEach((level) => {
            this.getLevels(factorIndex).push(this.addLevels(level.name, level.alias));
          });
          factorIndex++;
        });
      });

      this.isExperimentEditable =
        this.experimentInfo.state !== this.ExperimentState.ENROLLING &&
        this.experimentInfo.state !== this.ExperimentState.ENROLLMENT_COMPLETE;

      // disable control on edit:
      if (!this.isExperimentEditable) {
        this.factorialExperimentDesignForm.disable();
      }
    }
    this.updateView();

    // Bind predefined values of experiment factors from backend
    const factorFormControl = this.factorialExperimentDesignForm.get('factors') as FormArray;
    factorFormControl.controls.forEach((_, index) => {
      this.manageExpFactorPointAndIdControl(index);
    });

    this.factorialExperimentDesignForm.get('factors').valueChanges.subscribe((newValues) => {
      this.validateFactorNames(newValues);
    });
  }

  manageExpFactorPointAndIdControl(factorIndex: number) {
    const factorFormControl = this.factor as FormArray;
    this.filteredExpFactors$[factorIndex] = factorFormControl
      .at(factorIndex)
      .get('factor')
      .valueChanges.pipe(
        startWith<string>(''),
        map((factor) => this.filterExpFactorsPointsAndIds(factor, 'expFactors'))
      );
    this.filteredExpPoints$[factorIndex] = factorFormControl
      .at(factorIndex)
      .get('site')
      .valueChanges.pipe(
        startWith<string>(''),
        map((site) => this.filterExpFactorsPointsAndIds(site, 'expPoints'))
      );
    this.filteredExpIds$[factorIndex] = factorFormControl
      .at(factorIndex)
      .get('target')
      .valueChanges.pipe(
        startWith<string>(''),
        map((target) => this.filterExpFactorsPointsAndIds(target, 'expIds'))
      );
  }

  // createDesignDataSubject(): void {
  //   this.designDataSub = combineLatest([
  //     this.factorialExperimentDesignForm.get('partitions').valueChanges,
  //     this.factorialExperimentDesignForm.get('conditions').valueChanges,
  //   ])
  //     .pipe(
  //       pairwise(),
  //       filter((designData) => this.experimentDesignStepperService.filterForUnchangedDesignData(designData)),
  //       map(([_, current]) => current),
  //       filter((designData) => this.experimentDesignStepperService.validDesignDataFilter(designData))
  //     )
  //     .subscribe(this.designData$);
  // }

  // handleAliasTableDataChange(aliasTableData: ExperimentAliasTableRow[]) {
  //   this.aliasTableData = [...aliasTableData];
  // }

  handleConditionsButtonClick() {
    this.experimentDesignStepperService.updateFactorialDesignData(this.factorialExperimentDesignForm.value);
    this.scrollToConditionsTable();
  }

  private filterExpFactorsPointsAndIds(value: string, key: string): string[] {
    const filterValue = value ? value.toLocaleLowerCase() : '';

    if (!this.contextMetaData) {
      return [];
    }

    if (key === 'expPoints' && this.currentContext) {
      const currentContextExpPoints = this.contextMetaData.contextMetadata[this.currentContext].EXP_POINTS || [];
      return currentContextExpPoints.filter((option) => option.toLowerCase().startsWith(filterValue));
    } else if (key === 'expIds' && this.currentContext) {
      const currentContextExpIds = this.contextMetaData.contextMetadata[this.currentContext].EXP_IDS || [];
      return currentContextExpIds.filter((option) => option.toLowerCase().startsWith(filterValue));
    }
    return [];
  }

  addFactors(factor = null, site = null, target = null, order = null, level = null, alias = null) {
    return this._formBuilder.group({
      factor: [factor, Validators.required],
      site: [site, Validators.required],
      target: [target, Validators.required],
      order: [order],
      levels: this._formBuilder.array([this.addLevels(level, alias)]),
    });
  }

  addLevels(level = null, alias = null) {
    return this._formBuilder.group({
      level: [level, Validators.required],
      alias: [alias],
    });
  }

  getLevels(factorIndex: number) {
    const levelsArray = this.factor?.at(factorIndex).get('levels') as FormArray;
    return levelsArray;
  }

  addFactor() {
    const form = this.addFactors();
    this.factor?.push(form);
    this.updateView('factorTable');
    const factorFormControl = this.factorialExperimentDesignForm.get('factors') as FormArray;
    this.manageExpFactorPointAndIdControl(factorFormControl.controls.length - 1);
  }

  addLevel(factorIndex) {
    this.getLevels(factorIndex).push(this.addLevels());
    this.updateView('levelTable');
  }

  removeFactor(groupIndex: number) {
    this.factor.removeAt(groupIndex);
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.updateView();
    if (this.expandedId === groupIndex) {
      this.expandedId = null;
    }
  }

  removeLevel(factorIndex: number, levelIndex: number) {
    this.getLevels(factorIndex).removeAt(levelIndex);
    this.experimentDesignStepperService.experimentStepperDataChanged();
    this.updateView('levelTable');
  }

  expandFactor(groupIndex: number) {
    this.expandedId = this.expandedId === groupIndex ? null : groupIndex;
  }

  updateView(type?: string) {
    if (type === 'levelTable') {
      this.factorDataSource.next(this.level?.controls);
    }
    this.factorDataSource.next(this.factor?.controls);
    if (type) {
      this[type].nativeElement.scroll({
        top: this[type].nativeElement.scrollHeight - 91,
        behavior: 'smooth',
      });
    }
  }

  validateFactorNames(factors: any) {
    this.factorPointErrors = [];
    this.levelPointErrors = [];
    // Used to differentiate errors
    const duplicateFactors = [];

    factors.forEach((factor, index) => {
      // factorDetail:string = factor.site + ', ' + factor.target + ', ' + factor.factor;
      this.validateLevelNames(factor.levels, factor.site + ', ' + factor.target + ', ' + factor.factor);
      if (
        factors.find(
          (value, factorIndex) =>
            value.site === factor.site &&
            (value.target || '') === (factor.target || '') &&
            value.factor === factor.factor &&
            factorIndex !== index &&
            !duplicateFactors.includes(factor.site + ', ' + factor.target + ' and ' + factor.factor)
        )
      ) {
        duplicateFactors.push(factor.site + ', ' + factor.target + ' and ' + factor.factor);
      }
    });

    // Factor Points error messages
    if (duplicateFactors.length === 1) {
      this.factorPointErrors.push(duplicateFactors[0] + this.factorErrorMessages[0]);
    } else if (duplicateFactors.length > 1) {
      this.factorPointErrors.push(duplicateFactors.join(', ') + this.factorErrorMessages[1]);
    }
  }

  validateLevelNames(levels: any, factorDetail: string) {
    // Used to differentiate errors
    const duplicateLevels = [];

    levels.forEach((level, index) => {
      if (
        levels.find(
          (value, levelIndex) =>
            value.level === level.level &&
            levelIndex !== index &&
            !duplicateLevels.includes(factorDetail + " factor's " + level.level)
        )
      ) {
        duplicateLevels.push(factorDetail + " factor's " + level.level);
      }
    });

    // Level Points error messages
    if (duplicateLevels.length === 1) {
      this.levelPointErrors.push(duplicateLevels[0] + this.factorErrorMessages[2]);
    } else if (duplicateLevels.length > 1) {
      this.levelPointErrors.push(duplicateLevels.join(', ') + this.factorErrorMessages[3]);
    }
  }

  validateFactorCount(factorialExperimentDesignFormData: any) {
    this.factorCountError = null;
    this.levelCountError = null;
    const factorCountErrorMsg = this.translate.instant('home.new-experiment.design.factor-count-new-exp-error.text');
    const factorValueErrorMsg = this.translate.instant('home.new-experiment.design.factor-value-new-exp-error.text');
    const levelCountErrorMsg = this.translate.instant('home.new-experiment.design.level-count-new-exp-error.text');
    const levelValueErrorMsg = this.translate.instant('home.new-experiment.design.level-value-new-exp-error.text');
    
    if (factorialExperimentDesignFormData.factors.length > 0) {
      factorialExperimentDesignFormData.factors.forEach((factor,index) => {
        if (!factor.site.trim() || !factor.target.trim() || !factor.factor.trim()) {
          this.factorCountError = factorValueErrorMsg;
        }
        if(factor.levels.length>0){
          factor.levels.forEach((level) => {
            if (!level.level.trim()) {
              this.levelCountError=levelValueErrorMsg;
              this.expandedId=index;
            }
          });
        }else{
          this.levelCountError=levelCountErrorMsg;
          this.expandedId=index;
        }
      });
    } else {
      this.factorCountError = factorCountErrorMsg;
    }
  }

  validateFactors() {
    // Reset expPointAndIdErrors errors to re-validate data
    this.expPointAndIdErrors = [];
    const factorialExperimentDesignFormData = this.factorialExperimentDesignForm.value;
    const factorialPartitions = this.convertToPartitionData(factorialExperimentDesignFormData);
    this.validateExpPoints(factorialPartitions);
    this.validateExpIds(factorialPartitions);
  }

  validateExpPoints(partitions: ExperimentPartition[]) {
    const sites = partitions.map((partition) => partition.site);
    const currentContextExpPoints = this.contextMetaData.contextMetadata[this.currentContext].EXP_POINTS;

    for (let siteIndex = 0; siteIndex < sites.length; siteIndex++) {
      if (!currentContextExpPoints.includes(sites[siteIndex])) {
        // Add partition point selection error
        this.expPointAndIdErrors.push(this.factorErrorMessages[4]);
        break;
      }
    }
  }

  validateExpIds(partitions: ExperimentPartition[]) {
    const targets = partitions.map((partition) => partition.target).filter((target) => target);
    const currentContextExpIds = this.contextMetaData.contextMetadata[this.currentContext].EXP_IDS;

    for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      if (!currentContextExpIds.includes(targets[targetIndex])) {
        // Add partition id selection error
        this.expPointAndIdErrors.push(this.factorErrorMessages[5]);
        break;
      }
    }
  }

  isFormValid() {
    return (
      !this.factorPointErrors.length &&
      !this.expPointAndIdErrors.length &&
      this.factorialExperimentDesignForm.valid &&
      this.factorCountError === null &&
      this.levelCountError === null
    );
  }

  validateForm() {
    this.factorialExperimentDesignForm.updateValueAndValidity();
    // const factorialPartitions = this.convertToPartitionData(this.factorialExperimentDesignForm.value);
    this.validateFactorCount(this.factorialExperimentDesignForm.value);
  }

  emitEvent(eventType: NewExperimentDialogEvents) {
    switch (eventType) {
      case NewExperimentDialogEvents.CLOSE_DIALOG:
        if (
          this.factorialExperimentDesignForm.dirty ||
          this.experimentDesignStepperService.getHasExperimentDesignStepperDataChanged()
        ) {
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
        if (this.factorialExperimentDesignForm.dirty) {
          this.experimentDesignStepperService.experimentStepperDataChanged();
        }
        if (!this.isExperimentEditable) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: this.experimentInfo,
            path: NewExperimentPaths.EXPERIMENT_DESIGN,
          });
          break;
        }
        this.saveData(eventType);
        break;
      case NewExperimentDialogEvents.SAVE_DATA:
        if (!this.isExperimentEditable) {
          this.emitExperimentDialogEvent.emit({
            type: eventType,
            formData: this.experimentInfo,
            path: NewExperimentPaths.EXPERIMENT_DESIGN,
          });
          break;
        }
        this.saveData(eventType);
        this.experimentDesignStepperService.experimentStepperDataReset();
        this.factorialExperimentDesignForm.markAsPristine();
        break;
    }
  }

  saveData(eventType) {
    this.validateForm();

    // TODO: Uncomment to validate partitions with predefined site and target
    this.validateFactors();

    if (this.isFormValid()) {
      const factorialExperimentDesignFormData = this.factorialExperimentDesignForm.value;
      const factorialPartitions = this.convertToPartitionData(factorialExperimentDesignFormData);

      const factorialConditions: ExperimentCondition[] = [
        {
          createdAt: '2022-10-07T05:44:43.162Z',
          updatedAt: '2022-10-07T05:44:43.162Z',
          versionNumber: 1,
          id: uuidv4(),
          twoCharacterId: '5H',
          name: '',
          description: null,
          conditionCode: 'null',
          assignmentWeight: 100,
          order: 1,
          levelCombinationElements: [],
        },
      ];
      const factorialConditionAliases: ExperimentConditionAlias[] = [];

      // factorialExperimentDesignFormData.conditionAliases = this.createExperimentConditionAliasRequestObject(
      //   this.aliasTableData,
      //   factorialExperimentDesignFormData.factors
      // );

      this.emitExperimentDialogEvent.emit({
        type: eventType,
        formData: {
          conditions: factorialConditions,
          partitions: factorialPartitions,
          conditionAliases: factorialConditionAliases,
        },
        path: NewExperimentPaths.EXPERIMENT_DESIGN,
      });

      // scroll back to the factors table
      this.scrollToFactorsTable();
    }
  }

  convertToPartitionData(factorialExperimentDesignFormData) {
    let order = 1;
    let factorOrder = 1;
    const Partitions = [];
    factorialExperimentDesignFormData.factors.forEach((partition) => {
      let levelOrder = 1;
      const currentLevels: ExperimentLevel[] = partition.levels.map((level) => {
        return { name: level.level, alias: level.alias, id: uuidv4(), order: levelOrder++ };
      });
      const currentFactors: ExperimentFactor = {
        name: partition.factor,
        order: factorOrder++,
        levels: currentLevels,
      };
      if (
        !Partitions.find(
          (existingPartition) =>
            existingPartition.site === partition.site && existingPartition.target === partition.target
        )?.factors.push(currentFactors)
      ) {
        const partitionData = {
          site: partition.site,
          id: uuidv4(),
          description: '',
          order: order++,
          excludeIfReached: false,
          factors: [currentFactors],
        };
        partition.target
          ? Partitions.push({ ...partitionData, target: partition.target })
          : Partitions.push(partitionData);
      }
    });

    return Partitions;
  }

  // createExperimentConditionAliasRequestObject(
  //   aliases: ExperimentAliasTableRow[],
  //   conditions: ExperimentCondition[],
  //   decisionPoints: ExperimentPartition[]
  // ): ExperimentConditionAliasRequestObject[] {
  //   const conditionAliases: ExperimentConditionAliasRequestObject[] = [];

  //   aliases.forEach((aliasRowData: ExperimentAliasTableRow) => {
  //     // if no custom alias, return early, do not add to array to send to backend
  //     if (aliasRowData.alias === aliasRowData.condition) {
  //       return;
  //     }

  //     const parentCondition = conditions.find((condition) => condition.conditionCode === aliasRowData.condition);

  //     const decisionPoint = decisionPoints.find(
  //       (decisionPoint) => decisionPoint.target === aliasRowData.target && decisionPoint.site === aliasRowData.site
  //     );

  //     // need some error-handling in UI to prevent creation if aliases can't be created...
  //     if (!parentCondition || !decisionPoint) {
  //       console.log('cannot create alias data, cannot find id of parent condition/decisionpoint');
  //       return;
  //     }

  //     conditionAliases.push({
  //       id: aliasRowData.id || uuidv4(),
  //       aliasName: aliasRowData.alias,
  //       parentCondition: parentCondition.id,
  //       decisionPoint: decisionPoint.id,
  //     });
  //   });

  //   return conditionAliases;
  // }

  scrollToFactorsTable(): void {
    this.stepContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
      duration: 500,
      easing: 'easeOutCubic',
    });
  }

  scrollToConditionsTable(): void {
    this.stepContainer.nativeElement.scroll({
      top: this.stepContainer.nativeElement.scrollHeight / 2,
      behavior: 'smooth',
      duration: 500,
      easing: 'easeOutCubic',
    });
  }

  get factor(): FormArray {
    return this.factorialExperimentDesignForm?.get('factors') as FormArray;
  }

  get level(): FormArray {
    return this.factorialExperimentDesignForm?.get('factors').get('levels') as FormArray;
  }

  get NewExperimentDialogEvents() {
    return NewExperimentDialogEvents;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }

  ngOnDestroy() {
    this.subscriptionHandler?.unsubscribe();
  }
}
