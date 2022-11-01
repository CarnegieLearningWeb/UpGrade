import { Component, Input, OnChanges, OnInit } from '@angular/core';
import {
  ASSIGNMENT_UNIT,
  ExperimentVM,
  EnrollmentByConditionOrPartitionData,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'home-enrollment-condition-table',
  templateUrl: './enrollment-condition-table.component.html',
  styleUrls: ['./enrollment-condition-table.component.scss'],
})
export class EnrollmentConditionTableComponent implements OnChanges, OnInit {
  @Input() experiment: ExperimentVM;
  experimentData: any[] = [];
  commonColumns = ['expandIcon', 'condition', 'weight', 'userEnrolled'];
  displayedColumns: string[] = [];
  isStatLoading = true;
  experimentStateSub: Subscription;

  constructor(private experimentService: ExperimentService) {}

  ngOnChanges() {
    if (this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL) {
      this.displayedColumns = this.commonColumns;
    } else {
      this.displayedColumns = [...this.commonColumns, 'groupEnrolled'];
    }
  }

  ngOnInit() {
    this.experimentStateSub = this.experimentService.experimentStatById$(this.experiment.id).subscribe((stat) => {
      this.experimentData = [];
      if (stat && stat.conditions) {
        this.isStatLoading = false;
        stat.conditions.forEach((condition) => {
          const conditionObj: EnrollmentByConditionOrPartitionData = {
            condition: this.getConditionData(condition.id, 'conditionCode'),
            weight: this.getConditionData(condition.id, 'assignmentWeight'),
            userEnrolled: condition.users,
            groupEnrolled: condition.groups,
          };
          let experimentObj: any = {
            data: conditionObj,
          };

          const partitions = [];
          condition.partitions.forEach((partition) => {
            const partitionObj: EnrollmentByConditionOrPartitionData = {
              experimentPoint: this.getPartitionData(partition.id, 'site'),
              experimentId: this.getPartitionData(partition.id, 'target') || '',
              userEnrolled: partition.users,
              groupEnrolled: partition.groups,
            };
            partitions.push({
              data: partitionObj,
            });
          });
          experimentObj = {
            ...experimentObj,
            partitions,
          };
          this.experimentData.push(experimentObj);
        });
      }
    });
  }

  getPartitionData(partitionId: string, key: string) {
    return this.experiment.partitions.reduce(
      (acc, partition) => (partition.id === partitionId ? (acc = partition[key]) : acc),
      null
    );
  }

  getConditionData(conditionId: string, key: string) {
    return this.experiment.conditions.reduce(
      (acc, condition) => (condition.id === conditionId ? (acc = condition[key]) : acc),
      null
    );
  }

  ngOnDestroy() {
    this.experimentStateSub.unsubscribe();
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }
}
