import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Experiment, EXPERIMENT_STATE } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../pipes/experiment-state.pipe';

enum ExperimentFilterOptionsType {
  ALL = 'All',
  NAME = 'Name',
  TAGS = 'Tags',
  STATUS = 'Status'
}

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'state',
    'postExperiment',
    'createdAt',
    'tags',
    'enrollment',
    'view'
  ];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;
  experimentFilterOptions = [
    ExperimentFilterOptionsType.ALL,
    ExperimentFilterOptionsType.NAME,
    ExperimentFilterOptionsType.STATUS,
    ExperimentFilterOptionsType.TAGS
  ];
  selectedExperimentFilterOption = ExperimentFilterOptionsType.ALL;
  searchValue: string;
  tagsVisibility = [];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) {
    this.allExperimentsSub = this.experimentService.experiments$.subscribe(
      allExperiments => {
        this.allExperiments = new MatTableDataSource();
        this.allExperiments.data = allExperiments;
        this.allExperiments.paginator = this.paginator;
        this.allExperiments.sort = this.sort;
      }
    );
  }

  ngOnInit() {
    this.allExperiments.paginator = this.paginator;
    this.allExperiments.sort = this.sort;

    // Update angular material table's default sort
    this.allExperiments.sortingDataAccessor = (data: any, property) => {
      if (property === 'enrollment') {
        return data.stat.users ? data.stat.users : data.stat.group;
      } else if (property === 'postExperiment') {
        return data.postExperimentRule;
      } else {
        return data[property];
      }
    };
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: ExperimentFilterOptionsType) {
    this.allExperiments.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case ExperimentFilterOptionsType.ALL:
          return (
            data.name.toLowerCase().includes(filter) ||
            data.state.toLocaleLowerCase().includes(filter) ||
            !!data.tags.filter(tags =>
              tags.toLocaleLowerCase().includes(filter)
            ).length
          );
        case ExperimentFilterOptionsType.NAME:
          return data.name.toLowerCase().includes(filter);
        case ExperimentFilterOptionsType.STATUS:
          return data.state.toLowerCase().includes(filter);
        case ExperimentFilterOptionsType.TAGS:
          return !!data.tags.filter(tags =>
            tags.toLocaleLowerCase().includes(filter)
          ).length;
      }
    };
  }

  // TODO: Update experiment filter logic
  applyFilter(filterValue: string) {
    this.filterExperimentPredicate(this.selectedExperimentFilterOption);
    if (filterValue !== undefined) {
      this.allExperiments.filter = filterValue.trim().toLowerCase();
    }

    if (this.allExperiments.paginator) {
      this.allExperiments.paginator.firstPage();
    }
  }

  filterExperimentByTags(tagValue: string) {
    this.searchValue = tagValue;
    this.selectedExperimentFilterOption = ExperimentFilterOptionsType.TAGS;
    this.applyFilter(tagValue);
  }

  openNewExperimentDialog() {
    const dialogRef = this.dialog.open(NewExperimentComponent, {
      width: '55%'
    });

    dialogRef.afterClosed().subscribe(result => {
      // Code will be executed after closing dialog
    });
  }

  setTagsVisible(experimentId: string) {
    const index = this.tagsVisibility.findIndex(
      data => data.experimentId === experimentId
    );
    if (index !== -1) {
      this.tagsVisibility[index] = { experimentId, visibility: true };
    } else {
      this.tagsVisibility.push({ experimentId, visibility: true });
    }
    this.tagsVisibility.forEach((data, tagIndex) => {
      if (data.experimentId !== experimentId) {
        this.tagsVisibility[tagIndex] = { ...data, visibility: false };
      }
    });
  }

  // Used to check whether tags are visible for particular experiment or not
  isAllTagVisible(experimentId: string): boolean {
    const index = this.tagsVisibility.findIndex(
      data => data.experimentId === experimentId
    );
    return index !== -1 ? this.tagsVisibility[index].visibility : false;
  }

  getConditionCode(conditionId: string, experimentId: string) {
    const experimentFound = this.allExperiments.data.find(experiment => experiment.id === experimentId);
    return !!experimentFound ? '(' + experimentFound.conditions.find(condition => condition.id === conditionId).conditionCode + ')' : '';
  }

  ngOnDestroy() {
    this.allExperimentsSub.unsubscribe();
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }
}
