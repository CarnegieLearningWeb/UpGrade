import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Experiment, ExperimentCondition, ExperimentPartition } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { VersionService } from '../../../../../../core/version/version.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

interface ImportExperimentJSON {
  schema: Record<keyof Experiment, string> | Record<keyof ExperimentCondition, string> | Record<keyof ExperimentPartition, string>,
  data: Experiment | ExperimentCondition | ExperimentPartition
}

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss']
})
export class ImportExperimentComponent implements OnInit {
  experimentInfo: Experiment;
  isExperimentJSONValid = true;
  isExperimentJSONVersionValid = true;
  missingAllProperties: string;
  allPartitions = [];
  allPartitionsSub: Subscription;
  allExperiments: Experiment[] = [];
  importFileErrorsDataSource = new MatTableDataSource<{filename: string, error: string}>();
  importFileErrors: {filename: string, error: string}[] = [];
  displayedColumns: string[] = ['File Name', 'Error'];

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
    private versionService: VersionService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: MatSnackBar
  ) {}


  ngOnInit() {
    this.allPartitionsSub = this.experimentService.allPartitions$.pipe(
      filter(partitions => !!partitions))
      .subscribe((partitions: any) => {
      this.allPartitions = partitions.map(partition =>
        partition.target ? partition.site + partition.target : partition.site
      );
    });
  }
  openSnackBar() {
    this._snackBar.open(this.translate.instant('global.import-segments.message.text') , null, { duration: 4000 });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importExperiment() {
    this.allExperiments.forEach(exp => {
      exp.id = uuidv4();
      exp.conditions.map(condition => {
        condition.id = condition.id || uuidv4();
      });
    });
    this.experimentService.importExperiment(this.allExperiments);
    this.onCancelClick();
    this.openSnackBar();
  }
  async validateExperimentJSONVersion(experimentInfo: any): Promise<any> {
    const version = await this.versionService.getVersion();
    if (experimentInfo.backendVersion !== version) {
      return false;
    } else {
      return true;
    }
  }
  async validateDuplicateExperiment(partitions: any): Promise<any> {
    const alreadyExistedPartitions = [];
    partitions.forEach((partition) => {
      const partitionInfo = partition.target ? partition.site + partition.target : partition.site;
      if (this.allPartitions.indexOf(partitionInfo) !== -1 &&
        alreadyExistedPartitions.indexOf(partition.target ? partition.site + ' and ' + partition.target : partition.site) === -1) {
        // if we want to show the duplicate partition details:
        alreadyExistedPartitions.push(partition.target ? partition.site + ' and ' + partition.target : partition.site);
      }
    });

    if (alreadyExistedPartitions.length > 0) {
      return true;
    }
  }
  
  async uploadFile(event) {
    let index = 0, fileName = '';
    this.importFileErrors = [];
    const reader = new FileReader();

    readFile(index);
    function readFile(index: number) {
      if (index >= event.target.files.length) return;
      fileName = event.target.files[index].name;
      reader.readAsText(event.target.files[index]);
    }

    reader.addEventListener(
      'load',
      async function() {
        const result = JSON.parse(reader.result as any);
        this.experimentInfo = result;
        this.isExperimentJSONVersionValid = await this.validateExperimentJSONVersion(this.experimentInfo);
        this.isExperimentJSONValid = this.validateExperimentJSON(this.experimentInfo);

        if (this.isExperimentJSONVersionValid && this.isExperimentJSONValid) {
          this.allExperiments.push(this.experimentInfo);
        } else if (!this.isExperimentJSONValid) {
          this.importFileErrors.push({
            fileName: fileName,
            error: this.translate.instant('home.import-experiment.error.message.text')
          });
        } else {
          this.importFileErrors.push({
            fileName: fileName,
            error: this.translate.instant('home.import-experiment.version-error.message.text')
          });
          this.allExperiments.push(this.experimentInfo);
        }

        this.importFileErrorsDataSource.data = this.importFileErrors;
        readFile(++index);
      }.bind(this)
    );
  }

  private validateExperimentJSON(experiment: Experiment) {
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
      queries: 'array',
      stateTimeLogs: 'interface',
      filterMode: 'string',
      experimentSegmentInclusion: 'interface',
      experimentSegmentExclusion: 'interface',
      backendVersion: 'string'
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
      versionNumber: 'number'
    }

    const partitionSchema: Record<keyof ExperimentPartition, string> = {
      id: 'string',
      site: 'string',
      target: 'string',
      description: 'string',
      twoCharacterId: 'string',
      order: 'number',
      createdAt: 'string',
      updatedAt: 'string',
      versionNumber: 'number',
      excludeIfReached: 'boolean'
    }

    const missingProperties = this.checkForMissingProperties({ schema: experimentSchema, data: experiment });
    let missingPropertiesFlag = true;
    this.missingAllProperties = this.translate.instant('home.import-experiment.missing-properties.message.text') + missingProperties;
    let missingConditionProperties;
    let missingPartitionProperties;
    missingPropertiesFlag = missingPropertiesFlag && missingProperties.length === 0;
    experiment.conditions.map(condition => {
      missingConditionProperties = this.checkForMissingProperties({ schema: conditionSchema, data: condition });
    });
    if (missingConditionProperties.length > 0) {
      this.missingAllProperties = this.missingAllProperties + ', ' + this.translate.instant('global.condition.text') + ': ' + missingConditionProperties;
    }
    missingPropertiesFlag = missingPropertiesFlag && missingConditionProperties.length === 0;
    experiment.partitions.map(partition => {
      missingPartitionProperties = this.checkForMissingProperties({ schema: partitionSchema, data: partition });
    });
    if (missingPartitionProperties.length > 0) {
      this.missingAllProperties = this.missingAllProperties + ', ' + this.translate.instant('global.decision-points.text') + ': ' + missingPartitionProperties;
    }
    missingPropertiesFlag = missingPropertiesFlag && missingPartitionProperties.length === 0;
    return missingPropertiesFlag;
  }

  private checkForMissingProperties(experimentJson: ImportExperimentJSON) {
    const { schema, data } = experimentJson;
    const missingProperty = Object.keys(schema)
      .filter(key => data[key] === undefined)
      .map(key => key as keyof (Experiment | ExperimentPartition | ExperimentCondition))
      .map(key => `${key}`);
      return missingProperty.join(', ');
  }
}
