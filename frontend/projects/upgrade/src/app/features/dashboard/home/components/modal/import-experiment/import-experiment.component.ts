import { Component, Inject, OnInit } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import {
  Experiment,
  ExperimentCondition,
  ExperimentDecisionPoint,
  ExperimentFactor,
  ExperimentLevel,
  LevelCombinationElement,
  ExperimentConditionForSimpleExp,
} from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { VersionService } from '../../../../../../core/version/version.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { EXPERIMENT_TYPE, FILTER_MODE } from 'upgrade_types';

interface ImportExperimentJSON {
  schema:
    | Record<keyof Experiment, string>
    | Record<keyof ExperimentCondition, string>
    | Record<keyof ExperimentConditionForSimpleExp, string>
    | Record<keyof ExperimentDecisionPoint, string>
    | Record<keyof ExperimentFactor, string>
    | Record<keyof ExperimentLevel, string>
    | Record<keyof LevelCombinationElement, string>;
  data:
    | Experiment
    | ExperimentCondition
    | ExperimentConditionForSimpleExp
    | ExperimentDecisionPoint
    | ExperimentFactor
    | ExperimentLevel
    | LevelCombinationElement;
}

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss'],
})
export class ImportExperimentComponent implements OnInit {
  experimentInfo: Experiment;
  isExperimentJSONValid = true;
  experimentJSONVersionStatus = 0;
  missingAllProperties: string;
  allPartitions: ExperimentDecisionPoint[] = [];
  allPartitionsSub: Subscription;
  allExperiments: Experiment[] = [];
  importFileErrorsDataSource = new MatTableDataSource<{ filename: string; error: string }>();
  importFileErrors: { filename: string; error: string }[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];
  uploadedFileCount = 0;

  missingConditionProperties = '';
  missingPartitionProperties = '';
  missingFactorProperties = '';
  missingLevelProperties = '';
  missingLevelCombinationElementProperties = '';
  missingPropertiesFlag = false;
  isFactorialExperiment: boolean;

  // TODO remove this any after typescript version updation
  experimentSchema: any = {
    id: 'string',
    name: 'string',
    description: 'string',
    createdAt: 'string',
    updatedAt: 'string',
    versionNumber: 'number',
    state: 'enum',
    context: 'array',
    startOn: 'string',
    consistencyRule: 'enum',
    assignmentUnit: 'enum',
    postExperimentRule: 'enum',
    enrollmentCompleteCondition: 'enum',
    endOn: 'string',
    revertTo: 'string',
    tags: 'array',
    logging: 'boolean',
    group: 'string',
    conditions: 'interface',
    partitions: 'interface',
    factors: 'interface',
    queries: 'array',
    stateTimeLogs: 'interface',
    filterMode: 'string',
    experimentSegmentInclusion: 'interface',
    experimentSegmentExclusion: 'interface',
    backendVersion: 'string',
  };

  conditionSchema: Record<keyof ExperimentCondition, string> = {
    id: 'string',
    name: 'string',
    description: 'string',
    conditionCode: 'string',
    assignmentWeight: 'number',
    twoCharacterId: 'string',
    order: 'number',
    createdAt: 'string',
    updatedAt: 'string',
    versionNumber: 'number',
    levelCombinationElements: 'interface',
  };

  conditionSchemaForSimpleExp: Record<keyof ExperimentConditionForSimpleExp, string> = {
    id: 'string',
    name: 'string',
    description: 'string',
    conditionCode: 'string',
    assignmentWeight: 'number',
    twoCharacterId: 'string',
    order: 'number',
    createdAt: 'string',
    updatedAt: 'string',
    versionNumber: 'number',
  };

  levelCombinationElementSchema: Record<keyof LevelCombinationElement, string> = {
    id: 'string',
    level: 'interface',
  };

  partitionSchema: Record<keyof ExperimentDecisionPoint, string> = {
    id: 'string',
    site: 'string',
    target: 'string',
    description: 'string',
    twoCharacterId: 'string',
    order: 'number',
    createdAt: 'string',
    updatedAt: 'string',
    versionNumber: 'number',
    excludeIfReached: 'boolean',
  };

  factorSchema: Record<keyof ExperimentFactor, string> = {
    name: 'string',
    description: 'string',
    order: 'number',
    levels: 'interface',
  };

  levelSchema: Record<keyof ExperimentLevel, string> = {
    id: 'string',
    name: 'string',
    payload: 'string',
    order: 'number',
  };

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
    private versionService: VersionService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.allPartitionsSub = this.experimentService.allDecisionPoints$
      .pipe(filter((partitions) => !!partitions))
      .subscribe((partitions: any) => {
        this.allPartitions = partitions.map((partition) =>
          partition.target ? partition.site + partition.target : partition.site
        );
      });
  }

  openSnackBar() {
    this._snackBar.open(this.translate.instant('global.import-segments.message.text'), null, { duration: 4000 });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  /* Check if string is valid UUID */
  checkIfValidUUID(str: string) {
    // Regular expression to check if string is a valid UUID
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(str);
  }

  importExperiment() {
    this.allExperiments.forEach((exp) => {
      exp.id = uuidv4();
      exp.conditions.map((condition) => {
        condition.id = condition.id || uuidv4();
      });
    });
    this.allExperiments.forEach((exp) => {
      exp.partitions.map((decisionPoint) => {
        decisionPoint.id = this.checkIfValidUUID(decisionPoint.id) ? decisionPoint.id : uuidv4();
      });
    });
    this.experimentService.importExperiment(this.allExperiments);
    this.onCancelClick();
    this.openSnackBar();
  }

  compareVersion(currentBackendVersion, uploadedExperimentBackendVersion) {
    currentBackendVersion = currentBackendVersion
      .split('.')
      .map((s) => s.padStart(10))
      .join('.');
    uploadedExperimentBackendVersion = uploadedExperimentBackendVersion
      .split('.')
      .map((s) => s.padStart(10))
      .join('.');

    if (currentBackendVersion === uploadedExperimentBackendVersion) {
      return 0;
    } else if (currentBackendVersion > uploadedExperimentBackendVersion) {
      return 1;
    } else {
      return 2;
    }
  }

  async validateExperimentJSONVersion(experimentInfo: any): Promise<any> {
    const currentBackendVersion = await this.versionService.getVersion();
    const versionStatus = this.compareVersion(currentBackendVersion, experimentInfo.backendVersion);
    return versionStatus;
  }

  async validateDuplicateExperiment(partitions: any): Promise<any> {
    const alreadyExistedPartitions = [];
    partitions.forEach((partition) => {
      const partitionInfo = partition.target ? partition.site + partition.target : partition.site;
      if (
        this.allPartitions.includes(partitionInfo) &&
        !alreadyExistedPartitions.includes(
          partition.target ? partition.site + ' and ' + partition.target : partition.site
        )
      ) {
        // if we want to show the duplicate partition details:
        alreadyExistedPartitions.push(partition.target ? partition.site + ' and ' + partition.target : partition.site);
      }
    });

    if (alreadyExistedPartitions.length > 0) {
      return true;
    }
  }

  async validateExperimentJSON(experiment: Experiment) {
    let missingProperties = this.checkForMissingProperties({ schema: this.experimentSchema, data: experiment });
    const missingPropertiesList = missingProperties !== '' ? missingProperties.split(', ') : [];

    if (missingPropertiesList.includes('backendVersion')) {
      const currentBackendVersion = await this.versionService.getVersion();
      experiment = { ...experiment, backendVersion: currentBackendVersion.toString() };
      const index = missingPropertiesList.indexOf('backendVersion');
      if (index > -1) {
        missingPropertiesList.splice(index, 1);
      }
    }

    if (missingPropertiesList.includes('filterMode')) {
      experiment = { ...experiment, filterMode: FILTER_MODE.INCLUDE_ALL };
      const index = missingPropertiesList.indexOf('filterMode');
      if (index > -1) {
        missingPropertiesList.splice(index, 1);
      }
    }

    missingProperties = missingPropertiesList.join(', ');

    this.isFactorialExperiment = experiment.type === EXPERIMENT_TYPE.FACTORIAL;

    this.missingAllProperties =
      this.translate.instant('home.import-experiment.missing-properties.message.text') + missingProperties;

    this.missingPropertiesFlag = this.updateMissingPropertiesFlag(missingProperties);

    this.checkMissingConditionProperties(experiment.conditions);

    if (this.missingConditionProperties.length > 0) {
      this.missingAllProperties =
        this.missingAllProperties +
        ', ' +
        this.translate.instant('global.condition.text') +
        ': ' +
        this.missingConditionProperties;
    }

    this.missingPropertiesFlag = this.updateMissingPropertiesFlag(this.missingConditionProperties);

    this.checkMissingPartitionProperties(experiment.partitions);

    const missingPartitionPropertiesList = this.missingPartitionProperties.split(', ');

    if (missingPartitionPropertiesList.length > 0) {
      if (missingPartitionPropertiesList.includes('excludeIfReached')) {
        experiment.partitions = this.addMissingExcludeIfReachedProperty(experiment.partitions);

        const index = missingPartitionPropertiesList.indexOf('excludeIfReached');
        if (index > -1) {
          missingPartitionPropertiesList.splice(index, 1);
        }
      }
    }
    this.missingPartitionProperties = missingPartitionPropertiesList.join(', ');

    if (this.missingPartitionProperties.length > 0) {
      this.missingAllProperties =
        this.missingAllProperties +
        ', ' +
        this.translate.instant('global.decision-points.text') +
        ': ' +
        this.missingPartitionProperties;
    }

    if (this.isFactorialExperiment) {
      this.checkMissingFactorAndLevelProperties(experiment.factors);

      if (this.missingFactorProperties.length > 0) {
        this.missingAllProperties =
          this.missingAllProperties +
          ', ' +
          this.translate.instant('global.factor.text') +
          ': ' +
          this.missingFactorProperties;
      }
      this.missingPropertiesFlag = this.updateMissingPropertiesFlag(this.missingFactorProperties);
    }

    this.missingPropertiesFlag = this.updateMissingPropertiesFlag(this.missingPartitionProperties);

    return !this.missingPropertiesFlag;
  }
  updateMissingPropertiesFlag(missingPropertiesList: string): boolean {
    return this.missingPropertiesFlag && missingPropertiesList.length !== 0;
  }

  addMissingExcludeIfReachedProperty(partitions: ExperimentDecisionPoint[]): ExperimentDecisionPoint[] {
    return partitions.map((decisionPoint) => {
      return { ...decisionPoint, excludeIfReached: false };
    });
  }

  checkMissingFactorAndLevelProperties(factors: ExperimentFactor[]) {
    factors.map((factor) => {
      this.missingFactorProperties = this.checkForMissingProperties({ schema: this.factorSchema, data: factor });
      factor.levels.map((level) => {
        this.missingLevelProperties = this.checkForMissingProperties({ schema: this.levelSchema, data: level });
      });

      if (this.missingLevelProperties.length > 0) {
        this.missingAllProperties =
          this.missingAllProperties +
          ', ' +
          this.translate.instant('global.levelCombinationElement.text') +
          ': ' +
          this.missingLevelProperties;
      }
      this.missingPropertiesFlag = this.missingPropertiesFlag && this.missingLevelProperties.length !== 0;
    });
  }

  checkMissingPartitionProperties(partitions: ExperimentDecisionPoint[]) {
    partitions.map((partition) => {
      this.missingPartitionProperties = this.checkForMissingProperties({
        schema: this.partitionSchema,
        data: partition,
      });
    });
  }

  checkMissingConditionProperties(conditions: ExperimentCondition[]) {
    conditions.map((condition) => {
      this.missingConditionProperties = this.checkForMissingProperties({
        schema: this.isFactorialExperiment ? this.conditionSchema : this.conditionSchemaForSimpleExp,
        data: condition,
      });

      if (this.isFactorialExperiment) {
        condition.levelCombinationElements.map((element) => {
          this.missingLevelCombinationElementProperties = this.checkForMissingProperties({
            schema: this.levelCombinationElementSchema,
            data: element,
          });
        });
        if (this.missingLevelCombinationElementProperties.length > 0) {
          this.missingAllProperties =
            this.missingAllProperties +
            ', ' +
            this.translate.instant('global.level.text') +
            ': ' +
            this.missingLevelCombinationElementProperties;
        }
        this.missingPropertiesFlag =
          this.missingPropertiesFlag && this.missingLevelCombinationElementProperties.length !== 0;
      }
    });
  }

  private checkForMissingProperties(experimentJson: ImportExperimentJSON) {
    const { schema, data } = experimentJson;
    const missingProperty = Object.keys(schema)
      .filter((key) => data[key] === undefined)
      .map(
        (key) =>
          key as keyof (
            | Experiment
            | ExperimentDecisionPoint
            | ExperimentCondition
            | ExperimentConditionForSimpleExp
            | ExperimentFactor
            | ExperimentLevel
            | LevelCombinationElement
          )
      )
      .map((key) => `${key}`);
    return missingProperty.join(', ');
  }

  deduceConditionPayload(result) {
    if (result.conditionAliases) {
      result.conditionPayloads = result.conditionAliases;
      result.conditionAliases.forEach((payload, payloadIndex) => {
        result.conditionPayloads[payloadIndex].payload = {};
        result.conditionPayloads[payloadIndex].payload.type = 'string';
        result.conditionPayloads[payloadIndex].payload.value = payload.aliasName;
      });
      delete result.conditionAliases;
    }

    return result;
  }

  deducePartition(result) {
    result.partitions.forEach((decisionPoint, decisionPointIndex) => {
      if (decisionPoint.expPoint) {
        result.partitions[decisionPointIndex].site = decisionPoint.expPoint;
        delete result.partitions[decisionPointIndex].expPoint;
      }

      if (decisionPoint.expId) {
        result.partitions[decisionPointIndex].target = decisionPoint.expId;
        delete result.partitions[decisionPointIndex].expId;
      }

      if (decisionPoint.factors) {
        result.partitions[decisionPointIndex].factors.forEach((factor) => {
          result.factors.push(factor);
        });
        delete result.partitions[decisionPointIndex].factors;
      }
    });

    return result;
  }

  deduceFactors(result) {
    result.factors.forEach((factor, factorIndex) => {
      factor.levels.forEach((level, levelIndex) => {
        if (level.alias) {
          result.factors[factorIndex].levels[levelIndex].payload = {};
          result.factors[factorIndex].levels[levelIndex].payload.type = 'string';
          result.factors[factorIndex].levels[levelIndex].payload.value = level.alias;
          delete result.factors[factorIndex].levels[levelIndex].alias;
        }
      });
    });
    return result;
  }

  updateExperimentJSON(result) {
    // adding missing fields:
    if (!result.factors) {
      result.factors = [];
    }
    // replacing old fields with new field names:
    result = this.deduceConditionPayload(result);
    result = this.deducePartition(result);
    result = this.deduceFactors(result);

    return result;
  }

  async validateExperiment(experimentInfo, fileName, experimentJSONVersionStatus) {
    if (experimentInfo.backendVersion) {
      experimentJSONVersionStatus = await this.validateExperimentJSONVersion(experimentInfo);
    }

    const isExperimentJSONValid = await this.validateExperimentJSON(experimentInfo);

    if (experimentJSONVersionStatus === 0 && isExperimentJSONValid) {
      this.allExperiments.push(experimentInfo);
    } else if (!isExperimentJSONValid) {
      this.importFileErrors.push({
        filename: fileName,
        error: this.translate.instant('home.import-experiment.error.message.text') + ' ' + this.missingAllProperties,
      });
    } else {
      if (experimentJSONVersionStatus === 1) {
        this.importFileErrors.push({
          filename: fileName,
          error: this.translate.instant('home.import-experiment.old-version-error.message.text'),
        });
      } else {
        this.importFileErrors.push({
          filename: fileName,
          error: this.translate.instant('home.import-experiment.new-version-error.message.text'),
        });
      }
      this.allExperiments.push(experimentInfo);
    }
    return this.importFileErrors;
  }

  async uploadFile(event) {
    let index = 0;
    let fileName = '';
    const reader = new FileReader();
    this.uploadedFileCount = event.target.files.length;
    this.importFileErrors = [];

    readFile(index);
    function readFile(fileIndex: number) {
      if (fileIndex >= event.target.files.length) return;
      fileName = event.target.files[fileIndex].name;
      reader.readAsText(event.target.files[fileIndex]);
    }

    reader.addEventListener(
      'load',
      async function () {
        let result = JSON.parse(reader.result as any);
        result = this.updateExperimentJSON(result);
        this.experimentInfo = result;
        this.importFileErrorsDataSource.data = await this.validateExperiment(
          this.experimentInfo,
          fileName,
          this.experimentJSONVersionStatus
        );
        readFile(++index);
      }.bind(this)
    );
  }
}
