import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Experiment, ExperimentCondition, ExperimentPartition } from '../../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../../core/experiments/experiments.service';

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
  file: any;
  experimentInfo: Experiment;
  isExperimentJSONValid = true;

  constructor(
    private experimentService: ExperimentService,
    public dialogRef: MatDialogRef<ImportExperimentComponent>,
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

  uploadFile(event) {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      function() {
        const result = JSON.parse(reader.result as any);
        this.experimentInfo = result;
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
      filterMode: 'string',
      segmentExclude: 'interface',
      segmentInclude: 'interface',
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
    if (missingProperties.length > 0) {
      return false;
    } else {
      experiment.conditions.map(condition => {
        missingProperties = [ ...missingProperties, ...this.checkForMissingProperties({ schema: conditionSchema, data: condition })];
      });

      if (missingProperties.length > 0) {
        return false;
      } else {
        experiment.partitions.map(partition => {
          missingProperties = [ ...missingProperties, ...this.checkForMissingProperties({ schema: partitionSchema, data: partition })];
        });
        return missingProperties.length === 0;
      }
    }
  }

  private checkForMissingProperties(experimentJson: ImportExperimentJSON) {
    const { schema, data } = experimentJson;
    const missingProperties = Object.keys(schema)
      .filter(key => data[key] === undefined)
      .map(key => key as keyof (Experiment | ExperimentPartition | ExperimentCondition))
      .map(key => new Error(`Document is missing ${key} ${schema[key]}`));
      return missingProperties;
  }
}
