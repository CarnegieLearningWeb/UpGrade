import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { MatDialog } from '@angular/material';
import { ExperimentStatusComponent } from '../../components/modal/experiment-status/experiment-status.component';
import { PostExperimentRuleComponent } from '../../components/modal/post-experiment-rule/post-experiment-rule.component';
import { NewExperimentComponent } from '../../components/modal/new-experiment/new-experiment.component';
import { Experiment, ASSIGNMENT_UNIT, GroupTypes } from '../../../../core/experiments/store/experiments.model';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Used in view-experiment component only
enum DialogType {
  CHANGE_STATUS = 'Change status',
  CHANGE_POST_EXPERIMENT_RULE = 'Change post experiment rule',
  EDIT_EXPERIMENT = 'Edit Experiment'
}

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
  selector: 'app-view-experiment',
  templateUrl: './view-experiment.component.html',
  styleUrls: ['./view-experiment.component.scss']
})
export class ViewExperimentComponent implements OnInit, OnDestroy {

  experiment: Experiment;
  experimentSub: Subscription;
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


  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.experimentSub = this.experimentService.selectedExperiment$.pipe(
      filter(experiment => !!experiment)
    ).subscribe(experiment => {
      this.experiment = experiment;
      this.conditionsFilterOptions = [ALL_CONDITIONS];
      this.experiment.conditions.forEach(condition => {
        this.conditionsFilterOptions.push(condition.conditionCode);
      });
      this.setGroupFilterOptions(experiment.assignmentUnit);
    });
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

  openDialog(dialogType: DialogType, stepperIndex?: number) {
    const dialogComponent =
      dialogType === DialogType.CHANGE_STATUS
        ? ExperimentStatusComponent
        : (dialogType === DialogType.CHANGE_POST_EXPERIMENT_RULE ?  PostExperimentRuleComponent : NewExperimentComponent);
    const dialogRef = this.dialog.open(dialogComponent as any, {
      width: '50%',
      data: { experiment: this.experiment, stepperIndex: stepperIndex || 0 }
    });

    dialogRef.afterClosed().subscribe(result => {
    });
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

  get DialogType() {
    return DialogType;
  }

  get AssignmentUnit() {
    return ASSIGNMENT_UNIT;
  }

  get ExperimentFilter() {
    return ExperimentFilterType;
  }

  get ExperimentDateFilterOptions() {
    return ExperimentDateFilterOptions;
  }

  ngOnDestroy() {
    this.experimentSub.unsubscribe();
  }
}
