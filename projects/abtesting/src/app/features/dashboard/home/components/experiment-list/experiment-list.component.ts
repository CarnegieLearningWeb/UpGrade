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
import { Subscription, fromEvent, Observable } from 'rxjs';
import { MatDialog } from '@angular/material';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../pipes/experiment-state.pipe';
import { debounceTime } from 'rxjs/operators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss']
})
export class ExperimentListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = [
    'name',
    'state',
    'postExperimentRule',
    'createdAt',
    'context',
    'tags',
    'enrollment'
  ];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;
  experimentFilterOptions = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.TAG,
    EXPERIMENT_SEARCH_KEY.CONTEXT
  ];
  selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.ALL;
  searchValue: string;
  contextVisibility = [];
  tagsVisibility = [];
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;
  @ViewChild('tableContainer', { static: false }) experimentTableContainer: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allExperimentsSub = this.experimentService.experiments$.subscribe(
      allExperiments => {
        this.allExperiments = new MatTableDataSource();
        this.allExperiments.data = [ ...allExperiments];
        this.allExperiments.sort = this.sort;
        this.applyFilter(this.searchValue);
      }
    );

    this.experimentService.selectSearchExperimentParams().subscribe((searchParams: any) => {
      // Used when user clicks on context or tags from view experiment page
      this.searchValue = searchParams.searchString;
      this.selectedExperimentFilterOption = searchParams.searchKey;
      this.applyFilter(searchParams.searchString);
    });
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
            ).length || this.isPartitionFound(data, filter) ||
            !!data.context.filter(context =>
              context.toLocaleLowerCase().includes(filter)
            ).length
          );
        case EXPERIMENT_SEARCH_KEY.NAME:
          return data.name.toLowerCase().includes(filter) || this.isPartitionFound(data, filter);
        case EXPERIMENT_SEARCH_KEY.STATUS:
          return data.state.toLowerCase().includes(filter);
        case EXPERIMENT_SEARCH_KEY.TAG:
          return !!data.tags.filter(tags =>
            tags.toLocaleLowerCase().includes(filter)
          ).length;
        case EXPERIMENT_SEARCH_KEY.CONTEXT:
          return !!data.context.filter(context =>
            context.toLocaleLowerCase().includes(filter)
          ).length;
      }
    };
  }

  // Used to search based on partition point and name
  isPartitionFound(data: Experiment, filterValue: string): boolean {
    const isPartitionFound = data.partitions.filter(
      partition => (partition.expId ? partition.expId.toLocaleLowerCase().includes(filterValue) : false) || partition.expPoint.toLocaleLowerCase().includes(filterValue)
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

  filterExperimentByChips(tagValue: string, type: EXPERIMENT_SEARCH_KEY) {
    this.searchValue = tagValue;
    this.selectedExperimentFilterOption = type;
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

  setChipsVisible(experimentId: string, type: string) {
    const index = this[type].findIndex(
      data => data.experimentId === experimentId
    );
    if (index !== -1) {
      this[type][index] = { experimentId, visibility: true };
    } else {
      this[type].push({ experimentId, visibility: true });
    }
    this[type].forEach((data, tagIndex) => {
      if (data.experimentId !== experimentId) {
        this[type][tagIndex] = { ...data, visibility: false };
      }
    });
  }

  // Used to check whether context or tags are visible for particular experiment or not
  isAllChipsVisible(experimentId: string, type: string): boolean {
    const index = this[type].findIndex(
      data => data.experimentId === experimentId
    );
    return index !== -1 ? this[type][index].visibility : false;
  }

  getConditionCode(conditionId: string, experimentId: string) {
    const experimentFound = this.allExperiments.data.find(experiment => experiment.id === experimentId);
    return !!experimentFound ? '(' + experimentFound.conditions.find(condition => condition.id === conditionId).conditionCode + ')' : '';
  }

  ngOnDestroy() {
    this.allExperimentsSub.unsubscribe();
    // TODO: should implement persist search
    this.experimentService.setSearchString(null);
    this.experimentService.setSearchKey(EXPERIMENT_SEARCH_KEY.ALL);
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

  get ExperimentSearchKey() {
    return EXPERIMENT_SEARCH_KEY;
  }
}
