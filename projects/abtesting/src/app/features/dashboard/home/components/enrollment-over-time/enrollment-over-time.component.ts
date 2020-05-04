import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { ASSIGNMENT_UNIT } from 'upgrade_types';
import { ExperimentVM, ExperimentGraphDateFilterOptions } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { filter } from 'rxjs/operators';
import * as intersectionby from 'lodash.intersectionby';
import { subDays, min, isSameDay } from 'date-fns';
import * as clonedeep from 'lodash.clonedeep';
import { MatCheckboxChange } from '@angular/material';

// Used in EnrollmentOverTimeComponent
enum ExperimentFilterType {
  GROUP_FILTER = 'Group filter',
  CONDITION_FILTER = 'Condition filter',
  PARTITION_FILTER = 'Partition filter',
  DATE_FILTER = 'Date filter'
}

const INDIVIDUAL = 'Individual';

@Component({
  selector: 'home-enrollment-over-time',
  templateUrl: './enrollment-over-time.component.html',
  styleUrls: ['./enrollment-over-time.component.scss'],
})
export class EnrollmentOverTimeComponent implements OnChanges, OnInit, OnDestroy {
  @Input() experiment: ExperimentVM;
  groupFiltersOptions: string[] = [];
  conditionsFilterOptions: any[] = [];
  partitionsFilterOptions: any[] = [];
  dateFilterOptions: ExperimentGraphDateFilterOptions[] = [
    ExperimentGraphDateFilterOptions.LAST_7_DAYS,
    ExperimentGraphDateFilterOptions.LAST_3_MONTHS,
    ExperimentGraphDateFilterOptions.LAST_6_MONTHS,
    ExperimentGraphDateFilterOptions.LAST_12_MONTHS
  ];
  selectedGroupFilter: string = INDIVIDUAL;
  selectedCondition: string[] = [];
  selectedPartition: string[] = [];
  selectedDateFilter: ExperimentGraphDateFilterOptions = ExperimentGraphDateFilterOptions.LAST_7_DAYS;
  graphData = [];

  colors = ['#14c9be', '#6bc2ff', '#ff8084', '#866B8F', '#7AA3E5', '#8B3253'];
  colorScheme = {
    domain: this.colors
  };
  conditionsMap = new Map<string, any[]>();
  partitionsMap = new Map<string, any[]>();
  uniqueEnrolled = 0;
  groupEnrolled = 0;

  constructor(private experimentService: ExperimentService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.conditionsFilterOptions = [];
      this.experiment.conditions.forEach(condition => {
        this.conditionsFilterOptions.push({ code: condition.conditionCode, id: condition.id });
      });
      this.partitionsFilterOptions = [];
      this.experiment.partitions.forEach(partition => {
        this.partitionsFilterOptions.push({ point: partition.expPoint, id: partition.id });
      });
    }
  }

  ngOnInit() {
    // Map condition data to condition Map for better performance in graph
    this.experiment.conditions.map(condition => {
      this.conditionsMap.set(condition.id, []);
      this.selectedCondition.push(condition.id);
    });
    // Map partition data to partition Map for better performance in graph
    this.experiment.partitions.map(partition => {
      this.partitionsMap.set(partition.id, []);
      this.selectedPartition.push(partition.id);
    });
    this.groupFiltersOptions = this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL ? [INDIVIDUAL] : [INDIVIDUAL, this.experiment.group];
    this.experimentService.selectExperimentGraphInfo$.pipe(
      filter((info) => !!info)
    ).subscribe((graphInfo: any) => {
      graphInfo.forEach(data => {
        this.setMapValues(data);
      });
      this.populateGraphData();
    });
    // Used to fetch last 7 days graph data
    this.experimentService.setGraphRange(this.selectedDateFilter, this.experiment.id);
  }

  // Set graph info in condition and partition Map
  setMapValues(data: any) {
    // condition map
    if (!this.conditionsMap.has(data.conditionId)) {
      this.conditionsMap.set(data.conditionId, [data]);
    } else {
      const conditionsArr = this.conditionsMap.get(data.conditionId);
      this.conditionsMap.set(data.conditionId, [...conditionsArr, data]);
    }

    // partition map
    data.partitionIds.forEach((partitionId) => {
      if (!this.partitionsMap.has(partitionId)) {
        this.partitionsMap.set(partitionId, [data]);
      } else {
        const partitionsArr = this.partitionsMap.get(partitionId);
        this.partitionsMap.set(partitionId, [...partitionsArr, data]);
      }
    });
  }

  // remove empty series data labels
  formateXAxisLabel(value) {
    return !isNaN(value) ? '' : value.substring(0, 3);
  }

  formateYAxisLabel(value) {
    return (value % 1 !== 0) ? '' : value;
  }

  populateGraphData() {
    let graphInfo = [];
    const allConditions = {};
    // Do intersection of MAPS to filter selected condition and partition data
    this.selectedCondition.map(conditionId => {
      this.selectedPartition.map(partitionId => {
        graphInfo = [...new Set(
          [...graphInfo, ...intersectionby(this.conditionsMap.get(conditionId), this.partitionsMap.get(partitionId), 'userId')]
        )];
      });
    });
    this.uniqueEnrolled = graphInfo.length;

    if (this.selectedGroupFilter !== INDIVIDUAL) {
      const groupType = new Map<string, any>();
      graphInfo.map(user => {
        if (!groupType.has(user.groupId)) {
          groupType.set(user.groupId, user);
        } else {
          const groupTypeUser = groupType.get(user.groupId);
          const existingUserCreatedAt = Object.keys(groupTypeUser.createdAt).map(partition =>
            (new Date(groupTypeUser.createdAt[partition]).getTime())
          ).filter(date => !!date);
          const newUserCreatedAt = Object.keys(user.createdAt).map(partition => (new Date(user.createdAt[partition]).getTime()));
          const minDate = min([ ...existingUserCreatedAt, ...newUserCreatedAt ]);
          if (existingUserCreatedAt.indexOf(new Date(minDate).getTime()) === -1) {
            groupType.set(user.groupId, user);
          }
        }
      });
      graphInfo = Array.from(groupType.values());
      this.groupEnrolled = graphInfo.length;
    }

    // Set initial count to 0 for every conditions
    this.experiment.conditions.map(condition => {
      allConditions[condition.id] = 0;
    });

    switch (this.selectedDateFilter) {
      case ExperimentGraphDateFilterOptions.LAST_7_DAYS:
        const last7DaysData = {};
        for (let i = 6; i >= 0; i--) {
          last7DaysData[subDays(new Date(), i).toISOString()] = clonedeep(allConditions);
        }
        graphInfo.map(user => {
          const selectedPartitionsDates = this.selectedPartition.map(partitionId => {
            if (user.createdAt[partitionId]) {
              return new Date(user.createdAt[partitionId]);
            }
          }).filter(date => !!date);
          const minDate = min(selectedPartitionsDates);
          Object.keys(last7DaysData).map(currentDate => {
            const hasSameDay = isSameDay(new Date(currentDate), minDate);
            if (hasSameDay) {
              last7DaysData[currentDate][user.conditionId]++;
            }
          });
        });
        this.graphData = this.setDataInGraphFormat(last7DaysData, 'days');
        this.graphData = [...this.graphData, ...this.formEmptyGraphSeriesData(5)];
        break;
      case ExperimentGraphDateFilterOptions.LAST_3_MONTHS:
      case ExperimentGraphDateFilterOptions.LAST_6_MONTHS:
      case ExperimentGraphDateFilterOptions.LAST_12_MONTHS:
        this.setDateFilterData(allConditions, graphInfo);
        break;
    }
  }

  setDateFilterData(allConditions: any, graphInfo: any) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsValue = this.selectedDateFilter === ExperimentGraphDateFilterOptions.LAST_3_MONTHS ? 3 : (this.selectedDateFilter === ExperimentGraphDateFilterOptions.LAST_6_MONTHS ? 6 : 12);
    const lastMonths = {};
    for (let i = monthsValue - 1; i >= 0; i--) {
      lastMonths[months[((new Date().getMonth() - i) + 12) % 12]] = clonedeep(allConditions);
    }
    graphInfo.map(user => {
      const selectedPartitionsDates = this.selectedPartition.map(partitionId => {
        if (user.createdAt[partitionId]) {
          return new Date(user.createdAt[partitionId]);
        }
      }).filter(date => !!date);
      const minDate = min(selectedPartitionsDates);
      Object.keys(lastMonths).map(currentMonth => {
        const userDateMonth = new Date(minDate).getMonth();
        const isSameMonth = months[userDateMonth] === currentMonth;
        if (isSameMonth) {
          lastMonths[months[userDateMonth]][user.conditionId]++;
        }
      });
    });
    this.graphData = this.setDataInGraphFormat(lastMonths, 'month');
    this.graphData = [...this.graphData, ...this.formEmptyGraphSeriesData(12 - monthsValue)];
  }

  setDataInGraphFormat(data: any, type: string) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Object.keys(data).map(key => {
      const values = data[key];
      const series = Object.keys(values).map(innerKey =>
        ({
          name: this.getConditionCode(innerKey),
          value: values[innerKey]
        })
      );
      return {
        name: type === 'month' ? key : days[new Date(key).getDay()],
        series
      }
    }) as any;
  }

  applyExperimentFilter(type: ExperimentFilterType) {
    switch (type) {
      case ExperimentFilterType.DATE_FILTER:
        this.experimentService.setGraphRange(this.selectedDateFilter, this.experiment.id);
        break;
      }
    this.populateGraphData();
  }

  getConditionCode(conditionId: string): string {
    return this.experiment.conditions.reduce((acc, condition) =>
      acc = condition.id === conditionId ? condition.conditionCode : acc
      , '');
  }

  // Used to form empty series data to keep graph bar width same different value of time filter
  formEmptyGraphSeriesData(limit: number) {
    const emptySeries = [];
    for (let i = 0; i < limit; i++) {
      emptySeries.push({
        name: i,
        series: [{ name: '', value: 0 }]
      });
    }
    return emptySeries;
  }

  // For maintaining checkbox Select All in condition and partition filter
  isChecked(type: string): boolean {
    const selectedType = type === 'conditions' ? this.selectedCondition : this.selectedPartition;
    const filterOptions = type === 'conditions' ? this.conditionsFilterOptions : this.partitionsFilterOptions;
    return selectedType.length && filterOptions.length && selectedType.length === filterOptions.length;
  }

  isIndeterminate(type: string): boolean {
    const selectedType = type === 'conditions' ? this.selectedCondition : this.selectedPartition;
    const filterOptions = type === 'conditions' ? this.conditionsFilterOptions : this.partitionsFilterOptions;
    return selectedType && filterOptions.length && selectedType.length && selectedType.length < filterOptions.length;
  }

  toggleSelection(change: MatCheckboxChange, type: string): void {
    const selectedType = type === 'conditions' ? 'selectedCondition' : 'selectedPartition';
    const filterOptions = type === 'conditions' ? 'conditionsFilterOptions' : 'partitionsFilterOptions';
    this[selectedType] = change.checked ? this[filterOptions].map(data => data.id) : [];
    this.populateGraphData();
  }

  // Getters
  get ExperimentFilter() {
    return ExperimentFilterType;
  }

  get ExperimentGraphDateFilterOptions() {
    return ExperimentGraphDateFilterOptions;
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

  ngOnDestroy() {
    this.experimentService.setGraphRange(null, this.experiment.id);
  }
}
