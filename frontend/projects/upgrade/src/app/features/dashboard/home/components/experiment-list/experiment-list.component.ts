import { Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatSort } from '@angular/material/sort';
import {
  Experiment,
  EXPERIMENT_STATE,
  EXPERIMENT_SEARCH_KEY,
} from '../../../../../core/experiments/store/experiments.model';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { Subscription, fromEvent, Observable } from 'rxjs';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { NewExperimentComponent } from '../modal/new-experiment/new-experiment.component';
import { ExperimentStatePipeType } from '../../../../../shared/pipes/experiment-state.pipe';
import { debounceTime } from 'rxjs/operators';
import { UserPermission } from '../../../../../core/auth/store/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { ThemeOptions } from '../../../../../core/settings/store/settings.model';
import { ImportExperimentComponent } from '../modal/import-experiment/import-experiment.component';
import { FLAG_SEARCH_SORT_KEY } from '../../../../../core/feature-flags/store/feature-flags.model';
import { ExportModalComponent } from '../modal/export-experiment/export-experiment.component';

@Component({
  selector: 'home-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
})
export class ExperimentListComponent implements OnInit, OnDestroy, AfterViewInit {
  permissions$: Observable<UserPermission>;
  displayedColumns: string[] = ['name', 'state', 'postExperimentRule', 'createdAt', 'context', 'tags', 'enrollment'];
  allExperiments: MatTableDataSource<Experiment>;
  allExperimentsSub: Subscription;
  experimentFilterOptions = [
    EXPERIMENT_SEARCH_KEY.ALL,
    EXPERIMENT_SEARCH_KEY.NAME,
    EXPERIMENT_SEARCH_KEY.STATUS,
    EXPERIMENT_SEARCH_KEY.TAG,
    EXPERIMENT_SEARCH_KEY.CONTEXT,
  ];
  selectedExperimentFilterOption = EXPERIMENT_SEARCH_KEY.ALL;
  searchValue: string;
  contextVisibility = [];
  tagsVisibility = [];
  isLoadingExperiment$ = this.experimentService.isLoadingExperiment$;
  isAllExperimentsFetched = false;
  isAllExperimentsFetchedSub: Subscription;
  experimentSortKey$: Observable<string>;
  experimentSortAs$: Observable<string>;
  @ViewChild('tableContainer') experimentTableContainer: ElementRef;
  @ViewChild('searchInput') searchInput: ElementRef;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  theme$ = this.settingsService.theme$;
  constructor(
    private experimentService: ExperimentService,
    private dialog: MatDialog,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.permissions$ = this.authService.userPermissions$;
    this.allExperimentsSub = this.experimentService.experiments$.subscribe((allExperiments) => {
      this.allExperiments = new MatTableDataSource();
      this.allExperiments.data = [...allExperiments];
      this.allExperiments.sortingDataAccessor = (item, property) =>
        property === 'name' ? item.name.toLowerCase() : item[property];
      this.allExperiments.sort = this.sort;
      this.applyFilter(this.searchValue);
    });
    this.experimentSortKey$ = this.experimentService.selectExperimentSortKey$;
    this.experimentSortAs$ = this.experimentService.selectExperimentSortAs$;

    this.experimentService.selectSearchExperimentParams().subscribe((searchParams: any) => {
      // Used when user clicks on context or tags from view experiment page
      this.searchValue = searchParams.searchString;
      this.selectedExperimentFilterOption = searchParams.searchKey;
      this.applyFilter(searchParams.searchString);
    });

    this.isAllExperimentsFetchedSub = this.experimentService
      .isAllExperimentsFetched()
      .subscribe((value) => (this.isAllExperimentsFetched = value));
  }

  // Modify angular material's table's default search behavior
  filterExperimentPredicate(type: EXPERIMENT_SEARCH_KEY) {
    this.allExperiments.filterPredicate = (data, filter: string): boolean => {
      switch (type) {
        case EXPERIMENT_SEARCH_KEY.ALL:
          return (
            data.name.toLocaleLowerCase().includes(filter) ||
            data.state.toLocaleLowerCase().includes(filter) ||
            !!data.tags.filter((tags) => tags.toLocaleLowerCase().includes(filter)).length ||
            this.isPartitionFound(data, filter) ||
            !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length
          );
        case EXPERIMENT_SEARCH_KEY.NAME:
          return data.name.toLowerCase().includes(filter) || this.isPartitionFound(data, filter);
        case EXPERIMENT_SEARCH_KEY.STATUS:
          return data.state.toLowerCase().includes(filter);
        case EXPERIMENT_SEARCH_KEY.TAG:
          return !!data.tags.filter((tags) => tags.toLocaleLowerCase().includes(filter)).length;
        case EXPERIMENT_SEARCH_KEY.CONTEXT:
          return !!data.context.filter((context) => context.toLocaleLowerCase().includes(filter)).length;
      }
    };
  }

  // Used to search based on partition point and name
  isPartitionFound(data: Experiment, filterValue: string): boolean {
    const isPartitionFound = data.partitions.filter(
      (partition) =>
        (partition.target ? partition.target.toLocaleLowerCase().includes(filterValue) : false) ||
        partition.site.toLocaleLowerCase().includes(filterValue)
    );
    return !!isPartitionFound.length;
  }

  applyFilter(filterValue: string) {
    this.filterExperimentPredicate(this.selectedExperimentFilterOption);
    if (filterValue !== undefined) {
      this.allExperiments.filter = filterValue.trim().toLowerCase();
    }
  }

  setSearchKey() {
    this.experimentService.setSearchKey(this.selectedExperimentFilterOption);
  }

  setSearchString(searchString: FLAG_SEARCH_SORT_KEY) {
    this.experimentService.setSearchString(searchString);
  }

  changeSorting(event) {
    this.experimentService.setSortingType(event.direction ? event.direction.toUpperCase() : null);
    this.experimentService.setSortKey(event.direction ? event.active : null);
    this.experimentTableContainer.nativeElement.scroll({
      top: 0,
      behavior: 'smooth',
    });
    this.experimentService.loadExperiments(true);
  }

  filterExperimentByChips(tagValue: FLAG_SEARCH_SORT_KEY, type: EXPERIMENT_SEARCH_KEY) {
    this.selectedExperimentFilterOption = type;
    this.applyFilter(tagValue);
    this.setSearchKey();
    this.setSearchString(tagValue);
  }

  openNewExperimentDialog() {
    this.dialog.open(NewExperimentComponent, {
      panelClass: 'new-experiment-modal',
      disableClose: true,
    });
  }

  openImportExperimentDialog() {
    this.dialog.open(ImportExperimentComponent, {
      panelClass: 'import-experiment-modal',
    });
  }

  openExportAllExperimentsDialog() {
    this.dialog.open(ExportModalComponent, {
      panelClass: 'export-modal',
      data: { experiment: this.allExperiments.data },
    });
  }

  setChipsVisible(experimentId: string, type: string) {
    const index = this[type].findIndex((data) => data.experimentId === experimentId);
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
    const index = this[type].findIndex((data) => data.experimentId === experimentId);
    return index !== -1 ? this[type][index].visibility : false;
  }

  getConditionCode(conditionId: string, experimentId: string) {
    const experimentFound = this.allExperiments.data.find((experiment) => experiment.id === experimentId);
    return experimentFound
      ? '(' + experimentFound.conditions.find((condition) => condition.id === conditionId).conditionCode + ')'
      : '';
  }

  fetchExperimentOnScroll() {
    if (!this.isAllExperimentsFetched) {
      this.experimentService.loadExperiments();
    }
  }

  ngAfterViewInit() {
    // subtract other component's height
    const windowHeight = window.innerHeight;
    this.experimentTableContainer.nativeElement.style.maxHeight = windowHeight - 325 + 'px';

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(debounceTime(500))
      .subscribe((searchInput) => {
        this.setSearchString((searchInput as any).target.value);
      });
  }

  ngOnDestroy() {
    this.allExperimentsSub.unsubscribe();
    this.isAllExperimentsFetchedSub.unsubscribe();
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

  get Theme() {
    return ThemeOptions;
  }
}
