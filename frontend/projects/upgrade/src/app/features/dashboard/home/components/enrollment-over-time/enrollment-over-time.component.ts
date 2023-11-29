import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { ASSIGNMENT_UNIT } from 'upgrade_types';
import {
  ExperimentVM,
  DATE_RANGE,
  IEnrollmentStatByDate,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { filter } from 'rxjs/operators';
import { MatLegacyCheckboxChange as MatCheckboxChange } from '@angular/material/legacy-checkbox';
import { Subscription } from 'rxjs';

// Used in EnrollmentOverTimeComponent
enum ExperimentFilterType {
  GROUP_FILTER = 'Group filter',
  CONDITION_FILTER = 'Condition filter',
  PARTITION_FILTER = 'Partition filter',
  DATE_FILTER = 'Date filter',
}

const INDIVIDUAL = 'individual';

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
  dateFilterOptions: any[] = [
    { value: DATE_RANGE.LAST_SEVEN_DAYS, viewValue: 'Last 7 days' },
    { value: DATE_RANGE.LAST_THREE_MONTHS, viewValue: 'Last 3 months' },
    { value: DATE_RANGE.LAST_SIX_MONTHS, viewValue: 'Last 6 months' },
    { value: DATE_RANGE.LAST_TWELVE_MONTHS, viewValue: 'Last 12 months' },
  ];
  selectedGroupFilter: string = INDIVIDUAL;
  selectedCondition: string[] = [];
  selectedPartition: string[] = [];
  selectedDateFilter: DATE_RANGE = DATE_RANGE.LAST_SEVEN_DAYS;
  graphData = [];
  copyGraphData: IEnrollmentStatByDate[] = [];
  isInitialLoad = true;
  showLabelOfxAxis = true;

  colors = [
    '#31e8dd',
    '#7dc7fb',
    '#fedb64',
    '#51ed8f',
    '#ddaaf8',
    '#fd9099',
    '#14c9be',
    '#57ff6d',
    '#3dffec',
    '#fedb64',
    '#0a6de6',
    '#da0766',
    '#cd8014',
    '#fa59a1',
  ];
  colorScheme = {
    domain: this.colors,
  };
  totalMarkedUsers = 0;
  totalMarkedGroups = 0;

  graphInfoSub: Subscription;
  isGraphLoading$ = this.experimentService.isGraphLoading$;

  constructor(private experimentService: ExperimentService) {
    this.formateXAxisLabel = this.formateXAxisLabel.bind(this);
  }

  // Getters
  get ExperimentFilter() {
    return ExperimentFilterType;
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment && this.isInitialLoad) {
      this.isInitialLoad = false;
      this.conditionsFilterOptions = [];
      this.selectedCondition = [];
      this.experiment.conditions.forEach((condition) => {
        this.conditionsFilterOptions.push({ code: condition.conditionCode, id: condition.id });
        this.selectedCondition.push(condition.id);
      });
      this.partitionsFilterOptions = [];
      this.selectedPartition = [];
      this.experiment.partitions.forEach((partition) => {
        this.partitionsFilterOptions.push({
          point: partition.site,
          id: partition.id,
          twoCharacterId: partition.twoCharacterId,
        });
        this.selectedPartition.push(partition.id);
      });
      this.groupFiltersOptions =
        this.experiment.assignmentUnit === ASSIGNMENT_UNIT.INDIVIDUAL
          ? [INDIVIDUAL]
          : [INDIVIDUAL, this.experiment.group];
    }
    if (this.totalMarkedUsers > 0) {
      this.showLabelOfxAxis = true;
    } else {
      this.showLabelOfxAxis = false;
    }
  }

  ngOnInit() {
    this.graphInfoSub = this.experimentService.selectExperimentGraphInfo$
      .pipe(filter((info) => !!info))
      .subscribe((graphInfo: any) => {
        this.copyGraphData = graphInfo;
        this.populateGraphData(graphInfo);
      });
    // Used to fetch last 7 days graph data
    this.experimentService.setGraphRange(this.selectedDateFilter, this.experiment.id, -new Date().getTimezoneOffset());
  }

  // remove empty series data labels
  formateXAxisLabel(value) {
    if (this.selectedDateFilter === DATE_RANGE.LAST_SEVEN_DAYS) {
      return !isNaN(value) ? '' : value.substring(0, 5);
    }
    return !isNaN(value) ? '' : value.substring(0, 3);
  }

  formateYAxisLabel(value) {
    return value % 1 !== 0 ? '' : value;
  }

  populateGraphData(graphData: any) {
    this.graphData = this.setDataInGraphFormat(graphData);
    switch (this.selectedDateFilter) {
      case DATE_RANGE.LAST_SEVEN_DAYS:
        this.graphData = [...this.graphData, ...this.formEmptyGraphSeriesData(5)];
        break;
      case DATE_RANGE.LAST_THREE_MONTHS:
        this.graphData = [...this.graphData, ...this.formEmptyGraphSeriesData(9)];
        break;
      case DATE_RANGE.LAST_SIX_MONTHS:
        this.graphData = [...this.graphData, ...this.formEmptyGraphSeriesData(6)];
        break;
      case DATE_RANGE.LAST_TWELVE_MONTHS:
        this.graphData = [...this.graphData];
        break;
    }
  }

  setDataInGraphFormat(data: any) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.totalMarkedUsers = 0;
    this.totalMarkedGroups = 0;

    let series = [];
    return data.map((graphData) => {
      series = [];
      const graphInfoConditions = graphData.stats.conditions;
      this.experiment.conditions.map((condition) => {
        if (this.selectedCondition.includes(condition.id)) {
          let users = 0;
          let groups = 0;
          // Find index based on experiment conditions from graphInfoConditions to maintain colors
          const index = graphInfoConditions.findIndex((graphCondition) => graphCondition.id === condition.id);
          graphInfoConditions[index]?.partitions.map((partition) => {
            if (this.selectedPartition.includes(partition.id)) {
              users += partition.users;
              groups += partition.groups;
            }
          });
          series.push({
            name: this.getConditionCode(condition.id),
            value: this.selectedGroupFilter === INDIVIDUAL ? users : groups,
          });
          this.totalMarkedUsers += users;
          this.totalMarkedGroups += groups;
        } else {
          series.push({
            name: this.getConditionCode(condition.id),
            value: 0,
          });
        }
      });
      return {
        name:
          this.selectedDateFilter === DATE_RANGE.LAST_SEVEN_DAYS
            ? this.dateToString(new Date(graphData.date), days)
            : months[new Date(graphData.date).getMonth()],
        series,
      };
    });
  }

  applyExperimentFilter(type: ExperimentFilterType) {
    switch (type) {
      case ExperimentFilterType.DATE_FILTER:
        this.experimentService.setGraphRange(
          this.selectedDateFilter,
          this.experiment.id,
          -new Date().getTimezoneOffset()
        );
        break;
      default:
        this.populateGraphData(this.copyGraphData);
    }
  }

  getConditionCode(conditionId: string): string {
    return this.experiment.conditions.reduce(
      (acc, condition) => (acc = condition.id === conditionId ? condition.conditionCode : acc),
      ''
    );
  }

  // Used to form empty series data to keep graph bar width same different value of time filter
  formEmptyGraphSeriesData(limit: number) {
    const emptySeries = [];
    for (let i = 0; i < limit; i++) {
      emptySeries.push({
        name: i,
        series: [{ name: '', value: 0 }],
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
    this[selectedType] = change.checked ? this[filterOptions].map((data) => data.id) : [];
    this.populateGraphData(this.copyGraphData);
  }

  dateToString(date: Date, days: string[]) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = date.getFullYear();
    const day = days[date.getDay()].substring(0, 3);
    const newDate = mm + '/' + dd + '/' + yy + '-' + day;
    return newDate;
  }

  ngOnDestroy() {
    this.experimentService.setGraphRange(null, this.experiment.id, -new Date().getTimezoneOffset());
    this.graphInfoSub.unsubscribe();
  }
}
