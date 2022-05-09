import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Experiment, ExperimentCondition, ExperimentPartition } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';
import { VersionService } from '../../../../../../core/version/version.service';
import { TranslateService } from '@ngx-translate/core';

interface ImportExperimentJSON {
  schema: Record<keyof Experiment, string> | Record<keyof ExperimentCondition, string> | Record<keyof ExperimentPartition, string>,
  data: Experiment | ExperimentCondition | ExperimentPartition
}

@Component({
  selector: 'app-import-experiment',
  templateUrl: './import-experiment.component.html',
  styleUrls: ['./import-experiment.component.scss']
})
export class ImportExperimentComponent {
  experimentInfo: Experiment;
  isExperimentJSONValid = true;
  isExperimentJSONVersionValid = true;
  missingAllProperties: string;

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
    private versionService: VersionService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  importExperiment() {
    this.isExperimentJSONValid = this.validateExperimentJSON(this.experimentInfo);
    if (this.isExperimentJSONValid) {
      this.experimentService.importExperiment({ ...this.experimentInfo });
      this.onCancelClick();
    }
  }
  async validateExperimentJSONVersion(experimentInfo: any): Promise<any> {
    const version = await this.versionService.getVersion();
    if (experimentInfo.backendVersion !== version) {
      return false;
    } else {
      return true;
    }
  }

  async uploadFile(event) {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      async function() {
        const result = JSON.parse(reader.result as any);
        this.experimentInfo = result;
        this.isExperimentJSONVersionValid = await this.validateExperimentJSONVersion(this.experimentInfo);
      }.bind(this)
    );
    reader.readAsText(event.target.files[0]);
  }

  private validateExperimentJSON(experiment: Experiment) {
    const experimentSchema: Record<keyof Experiment, string> = {
      id: 'string',
      name: 'string',
      description: 'string',
      createdAt: 'string',
      updatedAt: 'string',
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
    }

    const partitionSchema: Record<keyof ExperimentPartition, string> = {
      id: 'string',
      expPoint: 'string',
      expId: 'string',
      description: 'string',
      twoCharacterId: 'string',
      order: 'number',
    }

    let missingProperties = this.checkForMissingProperties({ schema: experimentSchema, data: experiment });
    let missingPropertiesFlag = true;
    this.missingAllProperties = this.translate.instant('home.import-experiment.missing-properties.message.text') + missingProperties;
    let missingConditionProperties;
    let missingPartitionProperties;
    missingPropertiesFlag = missingPropertiesFlag && missingProperties.length === 0;
    experiment.conditions.map(condition => {
      missingConditionProperties = this.checkForMissingProperties({ schema: conditionSchema, data: condition });
    });
    if (missingConditionProperties.length > 0) {
      this.missingAllProperties = this.missingAllProperties + ", " + this.translate.instant('global.condition.text') + ": " + missingConditionProperties;
    }
    missingPropertiesFlag = missingPropertiesFlag && missingConditionProperties.length === 0;
    experiment.partitions.map(partition => {
      missingPartitionProperties = this.checkForMissingProperties({ schema: partitionSchema, data: partition });
    });
    if (missingPartitionProperties.length > 0) {
      this.missingAllProperties = this.missingAllProperties + ", " + this.translate.instant('global.partition.text') + ": " + missingPartitionProperties;
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
