import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { ASSIGNMENT_UNIT, ExperimentVM, EnrollmentByConditionOrPartitionData } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss']
})
export class EnrollmentConditionTableComponent implements OnChanges, OnInit {

  @Input() experiment: ExperimentVM;
  experimentData: any[] = [];
  commonColumns = [
    'expandIcon',
    'condition',
    'weight',
    'userEnrolled',
  ];
  displayedColumns: string[] = [];

  constructor(private experimentService: ExperimentService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      this.displayedColumns = this.commonColumns;
    } else {
      this.displayedColumns = [...this.commonColumns, 'groupEnrolled'];
    }
    if (changes.experiment) {
      // TODO: Remove
      this.experimentService.experimentStatById$(this.experiment.id).subscribe(stat => {
      });
    }
  }

  ngOnInit() {
    this.experimentService.experimentStatById$(this.experiment.id).subscribe(stat => {
      this.experimentData = [];
      if (stat.conditions) {
        stat.conditions.forEach(condition => {

          const conditionObj: EnrollmentByConditionOrPartitionData = {
            condition: this.getConditionData(condition.id, 'conditionCode'),
            weight: this.getConditionData(condition.id, 'assignmentWeight'),
            userEnrolled: condition.users,
            groupEnrolled: condition.groups,
          };
          let experimentObj: any = {
            'data': conditionObj
          };

          const partitions = [];
          (condition as any).partitions.forEach(partition => {
            const partitionObj: EnrollmentByConditionOrPartitionData = {
              experimentPoint: this.getPartitionData(partition.id, 'expPoint'),
              experimentId: this.getPartitionData(partition.id, 'expId') || '',
              userEnrolled: partition.users,
              groupEnrolled: partition.groups,
            };
            partitions.push({
              'data': partitionObj
            });
          });
          experimentObj = {
            ...experimentObj,
            partitions
          }
          this.experimentData.push(experimentObj);
        });
      }
    });
  }

  getPartitionData(partitionId: string, key: string) {
    return this.experiment.partitions.reduce((acc, partition) =>
      partition.id === partitionId ? acc = partition[key] : acc
      , null);
  }

  getConditionData(conditionId: string, key: string) {
    return this.experiment.conditions.reduce((acc, condition) =>
      condition.id === conditionId ? acc = condition[key] : acc
      , null);
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }
}
