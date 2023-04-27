import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
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
  allPartitions = [];
  allPartitionsSub: Subscription;
  allExperiments: Experiment[] = [];
  importFileErrorsDataSource = new MatTableDataSource<{ filename: string; error: string }>();
  importFileErrors: { filename: string; error: string }[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];
  uploadedFileCount = 0;

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
    // TODO remove this any after typescript version updation
    const experimentSchema: any = {
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

    const conditionSchema: Record<keyof ExperimentCondition, string> = {
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

    const conditionSchemaForSimpleExp: Record<keyof ExperimentConditionForSimpleExp, string> = {
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

    const partitionSchema: Record<keyof ExperimentDecisionPoint, string> = {
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

    const factorSchema: Record<keyof ExperimentFactor, string> = {
      name: 'string',
      description: 'string',
      order: 'number',
      levels: 'interface',
    };

    const levelSchema: Record<keyof ExperimentLevel, string> = {
      id: 'string',
      name: 'string',
      payload: 'string',
      order: 'number',
    };

    const levelCombinationElementSchema: Record<keyof LevelCombinationElement, string> = {
      id: 'string',
      level: 'interface',
    };

    let missingProperties = this.checkForMissingProperties({ schema: experimentSchema, data: experiment });
    const missingPropertiesList = missingProperties.split(', ');
    if (missingPropertiesList.includes('backendVersion')) {
      const currentBackendVersion = await this.versionService.getVersion();
      experiment = { ...experiment, backendVersion: currentBackendVersion.toString() };
      const index = missingPropertiesList.indexOf('filtebackendVersionrMode');
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
    const isFactorialExperiment = experiment.type === EXPERIMENT_TYPE.FACTORIAL;
    let missingPropertiesFlag = true;
    this.missingAllProperties =
      this.translate.instant('home.import-experiment.missing-properties.message.text') + missingProperties;
    let missingConditionProperties;
    let missingPartitionProperties;
    let missingFactorProperties;
    let missingLevelProperties;
    let missingLevelCombinationElementProperties;

    missingPropertiesFlag = missingPropertiesFlag && missingPropertiesList.length === 0;
    experiment.conditions.map((condition) => {
      missingConditionProperties = this.checkForMissingProperties({
        schema: isFactorialExperiment ? conditionSchema : conditionSchemaForSimpleExp,
        data: condition,
      });

      if (isFactorialExperiment) {
        condition.levelCombinationElements.map((element) => {
          missingLevelCombinationElementProperties = this.checkForMissingProperties({
            schema: levelCombinationElementSchema,
            data: element,
          });
        });
        if (missingLevelCombinationElementProperties.length > 0) {
          this.missingAllProperties =
            this.missingAllProperties +
            ', ' +
            this.translate.instant('global.level.text') +
            ': ' +
            missingLevelCombinationElementProperties;
        }
        missingPropertiesFlag = missingPropertiesFlag && missingLevelCombinationElementProperties.length === 0;
      }
    });
    if (missingConditionProperties.length > 0) {
      this.missingAllProperties =
        this.missingAllProperties +
        ', ' +
        this.translate.instant('global.condition.text') +
        ': ' +
        missingConditionProperties;
    }
    missingPropertiesFlag = missingPropertiesFlag && missingConditionProperties.length === 0;
    experiment.partitions.map((partition) => {
      missingPartitionProperties = this.checkForMissingProperties({
        schema: partitionSchema,
        data: partition,
      });
    });
    const missingPartitionPropertiesList = missingPartitionProperties.split(', ');
    if (missingPartitionPropertiesList.length > 0) {
      if (missingPartitionPropertiesList.includes('excludeIfReached')) {
        experiment.partitions = experiment.partitions.map((decisionPoint) => {
          return { ...decisionPoint, excludeIfReached: false };
        });
        const index = missingPartitionPropertiesList.indexOf('excludeIfReached');
        if (index > -1) {
          missingPartitionPropertiesList.splice(index, 1);
        }
      }
    }
    missingPartitionProperties = missingPartitionPropertiesList.join(', ');
    if (missingPartitionProperties.length > 0) {
      this.missingAllProperties =
        this.missingAllProperties +
        ', ' +
        this.translate.instant('global.decision-points.text') +
        ': ' +
        missingPartitionProperties;
    }
    if (isFactorialExperiment) {
      experiment.factors.map((factor) => {
        missingFactorProperties = this.checkForMissingProperties({ schema: factorSchema, data: factor });
        factor.levels.map((level) => {
          missingLevelProperties = this.checkForMissingProperties({ schema: levelSchema, data: level });
        });
        if (missingLevelProperties.length > 0) {
          this.missingAllProperties =
            this.missingAllProperties +
            ', ' +
            this.translate.instant('global.levelCombinationElement.text') +
            ': ' +
            missingLevelProperties;
        }
        missingPropertiesFlag = missingPropertiesFlag && missingLevelProperties.length === 0;
      });
      if (missingFactorProperties.length > 0) {
        this.missingAllProperties =
          this.missingAllProperties +
          ', ' +
          this.translate.instant('global.factor.text') +
          ': ' +
          missingFactorProperties;
      }
      missingPropertiesFlag = missingPropertiesFlag && missingFactorProperties.length === 0;
    }
    missingPropertiesFlag = missingPropertiesFlag && missingPartitionProperties.length === 0;
    return missingPropertiesFlag;
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
        const result = JSON.parse(reader.result as any);
        // adding missing fields:
        if (!result.factors) {
          result.factors = [];
        }
        // replacing old fields with new field names:
        if (result.conditionAliases) {
          result.conditionPayloads = result.conditionAliases;
          result.conditionAliases.forEach((payload, payloadIndex) => {
            result.conditionPayloads[payloadIndex].payload = {};
            result.conditionPayloads[payloadIndex].payload.type = 'string';
            result.conditionPayloads[payloadIndex].payload.value = payload.aliasName;
          });
          delete result.conditionAliases;
        }

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

        this.experimentInfo = result;

        if (this.experimentInfo.backendVersion) {
          this.experimentJSONVersionStatus = await this.validateExperimentJSONVersion(this.experimentInfo);
        }
        this.isExperimentJSONValid = this.validateExperimentJSON(this.experimentInfo);
        if (this.experimentJSONVersionStatus === 0 && this.isExperimentJSONValid) {
          this.allExperiments.push(this.experimentInfo);
        } else if (!this.isExperimentJSONValid) {
          this.importFileErrors.push({
            fileName: fileName,
            error:
              this.translate.instant('home.import-experiment.error.message.text') + ' ' + this.missingAllProperties,
          });
        } else {
          if (this.experimentJSONVersionStatus === 1) {
            this.importFileErrors.push({
              fileName: fileName,
              error: this.translate.instant('home.import-experiment.old-version-error.message.text'),
            });
          } else {
            this.importFileErrors.push({
              fileName: fileName,
              error: this.translate.instant('home.import-experiment.new-version-error.message.text'),
            });
          }
          this.allExperiments.push(this.experimentInfo);
        }

        this.importFileErrorsDataSource.data = this.importFileErrors;
        readFile(++index);
      }.bind(this)
    );
  }
}
