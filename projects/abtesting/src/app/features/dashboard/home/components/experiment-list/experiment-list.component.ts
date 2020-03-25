import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Experiment, EXPERIMENT_STATE, EXPERIMENT_SEARCH_KEY } from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Subscription, fromEvent } from 'rxjs';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../pipes/experiment-state.pipe';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss']
})
export class ExperimentListComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'name',
    'state',
    'postExperimentRule',
    'createdAt',
    'tags',
    'enrollment',
    'view'
  ];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;
  experimentFilterOptions = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.TAG
  ];
  selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.ALL;
  searchValue: string;
  tagsVisibility = [];
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;
  @ViewChild('tableContainer', { static: false }) experimentTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.allExperimentsSub = this.experimentService.experiments$.subscribe(
      allExperiments => {
        this.allExperiments = new MatTableDataSource();
        this.allExperiments.data = [ ...allExperiments];
        this.allExperiments.sort = this.sort;
        this.applyFilter(this.searchValue);
      }
    );
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: EXPERIMENT_SEARCH_KEY) {
    this.allExperiments.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case EXPERIMENT_SEARCH_KEY.ALL:
          return (
            data.name.toLocaleLowerCase().includes(filter) ||
            data.state.toLocaleLowerCase().includes(filter) ||
            !!data.tags.filter(tags =>
              tags.toLocaleLowerCase().includes(filter)
            ).length || this.isPartitionFound(data, filter)
          );
        case EXPERIMENT_SEARCH_KEY.NAME:
          return data.name.toLowerCase().includes(filter) || this.isPartitionFound(data, filter);
        case EXPERIMENT_SEARCH_KEY.STATUS:
          return data.state.toLowerCase().includes(filter);
        case EXPERIMENT_SEARCH_KEY.TAG:
          return !!data.tags.filter(tags =>
            tags.toLocaleLowerCase().includes(filter)
          ).length;
      }
    };
  }

  // Used to search based on partition point and name
  isPartitionFound(data: Experiment, filterValue: string): boolean {
    const isPartitionFound = data.partitions.filter(
      partition => (partition.name ? partition.name.toLocaleLowerCase().includes(filterValue) : false) || partition.point.toLocaleLowerCase().includes(filterValue)
    );
    return !!isPartitionFound.length;
  }

  // TODO: Update experiment filter logic
  applyFilter(filterValue: string) {
    this.filterExperimentPredicate(this.selectedExperimentFilterOption);
    if (filterValue !== undefined) {
      this.allExperiments.filter = filterValue.trim().toLowerCase();
    }
  }

  setSearchKey() {
    this.experimentService.setSearchKey(this.selectedExperimentFilterOption);
  }

  setSearchString(searchString: string) {
    this.experimentService.setSearchString(searchString);
  }

  changeSorting(event) {
    this.experimentService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.experimentService.setSortKey(event.direction ? event.active : null);
    this.experimentTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth'
    });
    this.experimentService.loadExperiments(true);
  }

  filterExperimentByTags(tagValue: string) {
    this.searchValue = tagValue;
    this.selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.TAG;
    this.applyFilter(tagValue);
    this.setSearchKey();
    this.setSearchString(this.searchValue);
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
    // TODO: should implement persist search
    this.experimentService.setSearchKey(EXPERIMENT_SEARCH_KEY.ALL);
    this.experimentService.setSearchString(null);
    this.experimentService.setSortKey(null);
    this.experimentService.setSortingType(null);
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.experimentTableContainer.nativeElement.style.maxHeight = (windowHeight - 350) + 'px';
    fromEvent(this.experimentTableContainer.nativeElement, 'scroll').pipe(debounceTime(500)).subscribe(value => {
      const height = this.experimentTableContainer.nativeElement.clientHeight;
      const scrollHeight = this.experimentTableContainer.nativeElement.scrollHeight - height;
      const scrollTop = this.experimentTableContainer.nativeElement.scrollTop;
      const percent = Math.floor(scrollTop / scrollHeight * 100);
      if (percent > 80) {
        this.experimentService.loadExperiments();
      }
    });

    fromEvent(this.searchInput.nativeElement, 'keyup').pipe(debounceTime(500)).subscribe(searchInput => {
      this.setSearchString((searchInput as any).target.value);
    });
  }

  get ExperimentStatePipeTypes() {
    return ExperimentStatePipeType;
  }

  get ExperimentState() {
    return EXPERIMENT_STATE;
  }
}
