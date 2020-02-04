import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ASSIGNMENT_UNIT } from 'ees_types';
import { GroupTypes, ExperimentVM } from '../../../../../core/experiments/store/experiments.model';

// Used in EnrollmentOverTimeComponent
enum ExperimentFilterType {
  GROUP_FILTER = 'Group filter',
  CONDITION_FILTER = 'Condition filter',
  DATE_FILTER = 'Date filter'
}

enum ExperimentDateFilterOptions {
  CUSTOM = 'Custom',
  LAST_3_MONTHS = 'Last 3 Months',
  LAST_6_MONTHS = 'Last 6 Months',
  LAST_9_MONTHS = 'Last 9 Months',
  LAST_12_MONTHS = 'Last 12 Months'
}

const ALL_CONDITIONS = 'All Conditions';
const USERS = 'Users';

@Component({
  selector: 'home-enrollment-over-time',
  templateUrl: './enrollment-over-time.component.html',
  styleUrls: ['./enrollment-over-time.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentOverTimeComponent implements OnChanges {
  @Input() experiment: ExperimentVM;
  groupFiltersOptions: string[] = [];
  conditionsFilterOptions: string[] = [ALL_CONDITIONS];
  dateFilterOptions: ExperimentDateFilterOptions[] = [
    ExperimentDateFilterOptions.CUSTOM,
    ExperimentDateFilterOptions.LAST_3_MONTHS,
    ExperimentDateFilterOptions.LAST_6_MONTHS,
    ExperimentDateFilterOptions.LAST_9_MONTHS,
    ExperimentDateFilterOptions.LAST_12_MONTHS
  ];
  selectedGroupFilter: string = USERS;
  selectedCondition: string[] = [ALL_CONDITIONS];
  selectedDateFilter: ExperimentDateFilterOptions = ExperimentDateFilterOptions.CUSTOM;
  selectedDateRange: string;

  chartData = [
    {
      'name': 'Jan',
      'series': [
        {
          'name': '5 students 2010',
          'value': 3,
        },
        {
          'name': '2011',
          'value': 2
        },
        {
          'name': '1990',
          'value': 5
        }
      ]
    },
    {
      'name': 'Feb',
      'series': [
        {
          'name': '2010',
          'value': 1
        },
        {
          'name': '2011',
          'value': 7
        },
        {
          'name': '1990',
          'value': 2
        }
      ]
    },
    {
      'name': 'Mar',
      'series': [
        {
          'name': '2010',
          'value': 3
        },
        {
          'name': '2011',
          'value': 3
        },
        {
          'name': '1990',
          'value': 4
        }
      ]
    },
    {
      'name': 'Apr',
      'series': [
        {
          'name': '2010',
          'value': 2
        },
        {
          'name': '1990',
          'value': 4
        }
      ]
    },
    {
      'name': 'May',
      'series': [
        {
          'name': '2010',
          'value': 4
        },
        {
          'name': '1990',
          'value': 3
        }
      ]
    },
    {
      'name': 'Jun',
      'series': [
        {
          'name': '2010',
          'value': 2
        },
        {
          'name': '1990',
          'value': 6
        }
      ]
    },
    {
      'name': 'Jul',
      'series': [
        {
          'name': '2010',
          'value': 1
        },
        {
          'name': '2011',
          'value': 2
        },
        {
          'name': '1990',
          'value': 3
        }
      ]
    },
    {
      'name': 'Aug',
      'series': [
        {
          'name': '2010',
          'value': 3
        },
        {
          'name': '1990',
          'value': 2
        }
      ]
    },
    {
      'name': 'Sep',
      'series': [
        {
          'name': '2010',
          'value': 4
        },
        {
          'name': '1990',
          'value': 1
        }
      ]
    },
    {
      'name': 'Oct',
      'series': [
        {
          'name': '2010',
          'value': 6
        },
        {
          'name': '1990',
          'value': 3
        }
      ]
    },
    {
      'name': 'Nov',
      'series': [
        {
          'name': '2010',
          'value': 2
        },
        {
          'name': '1990',
          'value': 4
        }
      ]
    },
    {
      'name': 'Dec',
      'series': [
        {
          'name': '2010',
          'value': 6
        },
        {
          'name': '1990',
          'value': 4
        }
      ]
    }
  ];
  colors = ['#14c9be', '#6bc2ff', '#ff8084'];
  colorScheme = {
    domain: this.colors
  };

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.experiment) {
      this.conditionsFilterOptions = [ALL_CONDITIONS];
      this.experiment.conditions.forEach(condition => {
        this.conditionsFilterOptions.push(condition.conditionCode);
      });
      this.setGroupFilterOptions(this.experiment.assignmentUnit);
    }
  }

  // Used to set options in enrollment over time group selection
  setGroupFilterOptions(assignmentUnit: ASSIGNMENT_UNIT) {
    switch (assignmentUnit) {
      case ASSIGNMENT_UNIT.INDIVIDUAL:
        this.groupFiltersOptions = [ USERS ];
        break;
      case ASSIGNMENT_UNIT.GROUP:
        this.groupFiltersOptions = [ USERS, GroupTypes.CLASS, GroupTypes.DISTRICT, GroupTypes.SCHOOL ];
        break;
    }
  }

  applyExperimentFilter(type: ExperimentFilterType) {
    switch (type) {
      case ExperimentFilterType.GROUP_FILTER:
        break;
      case ExperimentFilterType.CONDITION_FILTER:
        this.selectedCondition = this.selectedCondition.length === 0 ? [ALL_CONDITIONS] : this.selectedCondition;
        break;
      case ExperimentFilterType.DATE_FILTER:
        if (this.selectedDateFilter !== ExperimentDateFilterOptions.CUSTOM) {
          this.selectedDateRange = undefined;
        }
        break;
    }
  }

  get ExperimentFilter() {
    return ExperimentFilterType;
  }

  get ExperimentDateFilterOptions() {
    return ExperimentDateFilterOptions;
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

}
